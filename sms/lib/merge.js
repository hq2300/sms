var fs = require('fs');

//压缩包uglify
var jsp = require("uglify-js").parser;
var pro = require("uglify-js").uglify;

var utils = require('./utils.js').utils;

/*
 *merge@合并器
 *args@Array:路径数组
 *encode@String:文件编码
 *url@String:要合并的地址
 */

var _default = {
	     //请求对象
		 request:null,
	    //回应对象
    	response:null,
		//配置数据
		deploy:null,
		//路径
		path:null,
		//过滤路径
		filter:'',
		//根目录
		root:'',
		//直接读取
		direct:false,
		//成功回调
		successFun:function() {},
		//失败回调
		errorFun:function() {},
		//类型
		type:'',
		//是否压缩
		compress:false,
		//是否是最后一个
		ifend:false,
		//压缩数据
		args:[],
		//编码
		encode:'utf-8'
};


var merge = function(options) {
	
	var setting = utils.Extend(_default,(options || {}));
	
	for(var name in setting) {
	    
		this[name] = setting[name];
		
	}
    
	this.exits = false;
	
	this.data = '';

	this.marker = 0;
	
	this.ifall = false;

};

merge.prototype = {
	 
	 init:function(){
			
	        for(var i=0,len=this.deploy.length;i<len;i++) {
	    
		         if(this.path.replace(this.filter,'') == this.deploy[i].combine) {
		      
			            this.exits = true;
			  
			            this.args = this.deploy[i].include;
			  
		        }
		
	        }
			
			this.len = this.args.length;

		   if(this.exits && this.len>0) {

	           this.readFile(this.args[0]);
			   
		   }
		   
		   else {
		   
		      this.errorFun(this.response);
		   
		   }
	 },	 
	 
	 mergeAll:function() {
		 
		 this.ifall = true;
		 
		 this.len = this.args.length;
		 
		 this.readFile(this.args[0]);
		 
	 },
	 
     readFile:function(url) {
		  var _this = this;
		  fs.readFile(this.root+url,this.encode,function(err,data){
		        if(err) {
					console.log(err);
					_this.data+='';
				}
				else _this.data+=data;
				_this.marker+=1;
				if(_this.marker>=_this.len) _this.writeFile();
				else _this.readFile(_this.args[_this.marker]);
		  });
	 },
	 writeFile:function() {
		    
			var _this = this;
			
			if(this.direct) this.outputFile();
			
			else {
			     //文件夹验证创建
			     utils.createFolder({
			         path:this.path,
				     callback:function(){
                       _this.outputFile();
				     }
			     }).init();
			}
			
	 },
	 outputFile:function() {
		    var _this = this;
			if(this.compress && this.type=='js') {
			var ast = jsp.parse(_this.data);
				ast = pro.ast_mangle(ast);
				ast = pro.ast_mangle(ast);
				ast = pro.ast_squeeze(ast);
			_this.data = pro.gen_code(ast);
			}
			else if(this.compress && this.type=='css') {
			_this.data = _this.removeJsComments(_this.data);
			}
			fs.writeFile(_this.path,_this.data,_this.encode,function(err){
				if(err) console.log(err);
				else {
						if(_this.ifall) {
							  _this.response.write('all files merge and compress is over!');
						}
						else _this.response.write(_this.data);
						_this.response.end();
					}
				});	      
	 },
     removeJsComments:function(code) {
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