var fs = require('fs');

//压缩包uglify
var jsp = require("uglify-js").parser;
var pro = require("uglify-js").uglify;

var utils = require('./utils.js').utils;

/*
 *@merge:合并器
 */

var _default = {
	     //请求对象
		 request:null,
	    //回应对象
    	response:null,
		//路径
		path:null,
		//过滤路径
		filter:'',
		//根目录
		root:'',
		//合并路径
		minPath:'',
		//成功回调
		successFun:function() {},
		//失败回调
		errorFun:function() {},
		//编码
		encode:'utf-8'
};


var merge = function(options) {
	
	var setting = utils.Extend(_default,(options || {}));
	
	for(var name in setting) {
	    
		this[name] = setting[name];
		
	}

	this.endfile = false;

    this.init();
};

merge.prototype = {
	 
	 init:function(){

	 	this.cssPath = this.data['css'];

	 	this.jsPath = this.data['js'];

	 	this.cssLen = this.cssPath.length;

	 	this.jsLen = this.jsPath.length;

	 	//第一步，合并CSS
	 	this.mergecss(0);

	 },


	 mergecss:function(n) {

        if(n<this.cssLen) {

        	var toPath = this.root+this.minPath+this.cssPath[n].combine;

        	var fromPath = this.cssPath[n].include;

        	var len = fromPath.length;

        	this['cssfileData'+n] = '';

        	this.readFile(n,toPath,0,len,'css');

        }

        else {

        	 this.mergejs(0);

        }

	 },

	 mergejs:function(n) {
         
         if(n>=this.jsLen) return;

         var toPath = this.root+this.minPath+this.jsPath[n].combine;

         var fromPath = this.jsPath[n].include;

         var len = fromPath.length;

         this['jsfileData'+n] = '';

         this.readFile(n,toPath,0,len,'js');

	 },

	 readFile:function(n,path,pn,len,type) {
	 	var _this = this;
	 	fs.readFile(this.root+this[type+'Path'][n].include[pn],this.encode,function(err,data){
	 		if(err) {
	 			  console.log(err);
	 			  _this[type+'fileData'+n]+='';
	 		}
	 		else _this[type+'fileData'+n]+=data;
	 		pn+=1;
	 		if(pn>=len) {
	 			_this.writeFile(n,path,type);
	 		}
	 		else {
	 			_this.readFile(n,path,pn,len,type);
	 		}
	 	});
	 },

	 writeFile:function(n,path,type) {
	 	var _this = this;
	 	utils.createFolder({
	 		path:path,
	 		callback:function(){
	 			_this.outputFile(n,path,type);
	 		}
	 	}).init();
	 },

    outputFile:function(n,path,type) {
    	var _this = this;
    	if(type=='js') {
    		var ast = jsp.parse(this[type+'fileData'+n]);
    		ast = pro.ast_mangle(ast);
    		ast = pro.ast_mangle(ast);
    		ast = pro.ast_squeeze(ast);
    		this[type+'fileData'+n] = pro.gen_code(ast);
    	}
    	else if(type=='css'){
    	    this[type+'fileData'+n] = this.removeCssComments(this[type+'fileData'+n]);
    	}
    	fs.writeFile(path,this[type+'fileData'+n],this.encode,function(err){
    		   if(err) console.log(err);
    		   else {
    		   	    _this['merge'+type](n+1);
    		   	    _this.response.write(path+' merge and compress is over!\n');
    		   	    console.log(path);
    		   	    if(type=='js' && n+1==_this.jsLen) {
    		   	    	_this.response.write('success,all are over!!!');
    		   	    	_this.response.end();
    		   	    }
    		   }
    	});
    },

    removeCssComments:function(code) {
            return code
			.replace(/@charset\s\"utf\-8\";/g,'\n')
			.replace(/\n/g,'\n<!--jx-merge-overgeneralization-->\n')
			.replace(/(;|{|}|\?)\s*\/\//g,'$1\n\/\/')
			.replace(/(?:^|\n|\r)\s*\/\*[\s\S]*?\*\/\s*(?:\r|\n|$)/g, '\n')
			.replace(/(?:^|\n|\r)\s*\/\/.*(?:\r|\n|$)/g, '\n')
			.replace(/<!--jx-merge-overgeneralization-->/g,'\n')
			.replace(/\n|\r/g,'');
     }	 
};


exports.merge = function(options){
	
	return new merge(options);

}