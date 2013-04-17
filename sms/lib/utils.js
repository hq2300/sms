
var fs = require('fs');



/*
 *工具包
 *utils
 **/
var utils = {};

//扩展方法
utils.Extend = function(destination,source) {
    for (var property in source) {
		 destination[property] = source[property];
	}
	return destination;
};

//路径过滤
utils.realpath = function(path) {
    path = path.replace(/([^:\/])\/+/g, '$1\/');
    if (path.indexOf('.') === -1) {
      return path;
    }
    var old = path.split('/');
    var ret = [], part, i = 0, len = old.length;
    for (; i < len; i++) {
      part = old[i];
      if (part === '..') {
        if (ret.length === 0) {
          console.log('Invalid path:', path);
        }
        ret.pop();
      }
      else if (part !== '.') {
        ret.push(part);
      }
    }
    return ret.join('/');
};

//读取packages数据
utils.readPack = function(str) {
       var object = {css:[],js:[]};
	   var arr = str.split(';');
	   for(var i=0,len=arr.length;i<len;i++) {
	         if(arr[i].indexOf('#js')!=-1) {
			       //var reg = /^#js\[([\w\d\/\'\"\-\.\_\s\,]*)\]$/;
				   //object.js = reg.exec(arr[i])[1].split(',');
				   object.js = eval(arr[i].replace('#js',''));
			 }
			 else if(arr[i].indexOf('#css')!=-1) {
			       //var reg = /^#css\[([\w\d\/\'\"\-\.\_\s\,]*)\]$/;
				   //object.css = reg.exec(arr[i])[1].split(',');
				   object.css = eval(arr[i].replace('#css',''));
			 }
	   }
	   return object;
};

/*
 *xmlToJson
 *xml转换成json数组
 **/
var xmlToJson = function(options){
		var setting = utils.Extend(xmlToJson._default,(options || {}));
		for(var name in setting) {
		     this[name] = setting[name];
		}
		/*
		 *文件数组
		 *combine@合并获取的路径
		 *include@需合并路径集合
		 **/
		this.fileArr = [];
		//当前读取文件标示位
		this.marker = 0;
};

//默认值
xmlToJson._default = {
	   //需读取的文件配置
       files:{js:[],css:[]},
	   //文件类型
	   typer:'',
	   //根目录
	   root:'',
	   //读取文件的编码
	   encode:'utf-8',
	   //回调函数
	   callback:function(){}
};

xmlToJson.prototype = {
	  //初始化
      init:function() {
	       if(this.typer=='') return;
		   this.urlArr = this.files[this.typer];
		   this.len = this.urlArr.length;
		   this.readAsyn();
	  },
	  //合并所有
	  mergeAll:function() {
		   var fileJson = {};
		   for(var i=0;i<this.typer.length;i++) {
		          var name = this.typer[i];
				  var arr = this.readSysc(this.files[name]);
				  fileJson[name] = arr;
		   }
		   this.callback(fileJson);
	  },
	  //同步读取
	  readSysc:function(data) {
	         var jsonArr = [];
			 for(var i=0;i<data.length;i++) {
			        var d = fs.readFileSync(this.root+data[i],this.encode);
					jsonArr = jsonArr.concat(this.analyXml(d));
			 }
			 return jsonArr;
	  },
	  //解析数据
	  analyXml:function(data) {
	        var jsonArr = [];
			var arr = data.toString().split('</combine>');
			for(var i=0,len=arr.length;i<len;i++) {
			    var reg_combine = /<combine\s+path\s*=\s*"([\w\d\/\.\-\_]+)"\s*>/g;
				var result = reg_combine.exec(arr[i]);
				if(result!=null) {
				     var D = {combine:'',include:[]};
					 D.combine = result[1];
					 var res,
					 reg_include = /<\s*include\s*path=\s*"([\w\d\/\.\-\_]+)"\s*\/\s*>/g;
					 while((res = reg_include.exec(arr[i]))!=null) {
					        D.include.push(res[1]);
					 }
					 jsonArr.push(D);
				}
			}
			return jsonArr;
	  },
	  //异步读取
	  readAsyn:function() {
		   var _this = this;
	       fs.readFile(this.root+this.urlArr[this.marker],function(err,data){
	               if(err) console.log(err);
				   else {
					    _this.fileArr = _this.fileArr.concat(_this.analyXml(data));
						_this.marker+=1;
						if(_this.marker==_this.len) {
							_this.callback(_this.fileArr);
						}
						else _this.readAsyn();
				   }
		   });
	  }
};

//放置到扩展上
utils.xmlToJson = function(options) {
       return new xmlToJson(options);
};

/**
  *CreateFolder
  *文件夹的创建
  */
function CreateFolder(options) {
      var setting = utils.Extend(CreateFolder._default,(options || {}));
      for(var name in setting) {
	      this[name] = setting[name];
	  }
	  this.folders = [];
      this.marker = 0;
}

//默认值
CreateFolder._default = {
	    //路径
		path:null,
		//回调
		callback:function() {},
		//计数
		nums:0
};

CreateFolder.prototype = {
	  //初始化
      init:function() {
	       if(this.path && typeof this.path == 'string') {
		        this.folders = (this.path.indexOf('/')!=-1)?this.path.split('/'):[this.path];
		   }
		   if(this.folders.length>=1) this.createFolder(this.folders[0]);
	  },
	  //回调获取
	  getFolder:function(name) {
			this.marker+=1;
			if(this.marker>=this.folders.length-1) this.callback();
			else this.createFolder(name+'/'+this.folders[this.marker]);
	  },	  
	  //创建文件夹
	  createFolder:function(name){
		  var _this = this;
	      fs.readdir(name+'/',function(err,files){
				   //_this.nums+=1;
		           if(err) {
						 fs.mkdir(name+'/',function(err){
							  if(err) {
							       //if(_this.nums<=10) 
								   _this.createFolder(name);
								   //else 
								   //console.log(err);
							  }
							  else _this.getFolder(name);
						 });
				   }
				   else {
					   _this.getFolder(name);
				   }
		  });
	  }
};

utils.createFolder = function(options) {
       return new CreateFolder(options);
}

//文件夹列表显示
utils.listFolder = function(source,rootUrl) {
	  var arr = fs.readdirSync(source),
	      str = (arr && arr.length>0)?'<ul>':'NOT FILES IN THIS FOLDER!';
	  var url = utils.realpath('/'+source.replace(rootUrl+'/','')+'/').replace('//','/');
	  for(var i=0,len=arr.length;i<len;i++) {
	       str+='<li><a href="'+url+arr[i]+'">'+arr[i]+'</a></li>';
	  }
      return str;
}

//扩展
exports.utils = utils;