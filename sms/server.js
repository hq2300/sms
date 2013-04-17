/**
  *SMS
  *Static Merge Server
  *静态合并服务器
  *develop data@2012-09-10
  *version@1.0.0
  **/

//原生包引入
var http = require('http');
var url  = require('url');
var path = require('path');
var fs = require('fs');

//基本配置
var config = require('./lib/config.js');

//服务器响应状态
var status = require('./lib/status.js');

//可读文件类型
var mime = require('./lib/mime.js').mime;

//工具包
var utils = require('./lib/utils.js').utils;

//合并器
var mg = require('./lib/merge.js');

//合并所有
var mga = require('./lib/mergeAll.js');

//创建服务
http.createServer(function(request, response) {	
	
	//配置路径
	var mergePath = utils.readPack(fs.readFileSync(config.ROOT+config.mergeFile,'utf-8'));
	
	//访问路径地址
	var pathname = url.parse(request.url).pathname;
	
	//过滤版本
	pathname = pathname.replace(/\/[0-9a-zA-Z]{8}\/(js|css)/,'\/$1');
	
	//是否需合并
	var needMerge = (/\-min\.js|\-min\.css/ig).test(pathname)?true:false;
	
	//需合并的文件类型
	var mergeType = '';
	var mergeAllType = [];

	     for(var name in config.mergeType) {
			 mergeAllType.push(name);
	         if(pathname.indexOf(config.mergeType[name])!=-1) mergeType = name;
		 }

	//匹配绝对地址
	var realpath = needMerge?(config.ROOT + config.minPath + pathname):(config.ROOT + config.staticPath +pathname);
	
	//文件解析
	fs.stat(path.normalize(realpath),function(err,stats){		  
		   //未存在，是否创建
		   if(err) {
			    if(needMerge) {
					console.log(realpath);
					//创建
					utils.xmlToJson({
					   files:mergePath,
					   typer:mergeType,
					   root:config.ROOT,
					   callback:function(data){
					         mg.merge({
									  request:request,
									  response:response,
									  type:mergeType,
									  deploy:data,
									  path:realpath,
									  root:config.ROOT,
									  filter:config.ROOT+config.minPath,
									  errorFun:status.status404,
									  direct:false,
									  compress:config.Compress			      
							 }).init();
					   }
					}).init();
				}
				else if(pathname==config.mergeAll) {
				     utils.xmlToJson({
					      files:mergePath,
						  typer:mergeAllType,
						  root:config.ROOT,
						  callback:function(data) {

                                   mga.merge({
                                   	   request:request,
                                   	   response:response,
                                   	   root:config.ROOT,
                                   	   minPath:config.minPath,
                                   	   errorFun:status.status404,
                                   	   path:path,
                                   	   data:data
                                   });
						          /*for(var name in data) {
								  
								      var m_type = name,m_data = data[name];
									  
									  for(var i=0;i<m_data.length;i++) {
									  
									       var path = config.ROOT+config.minPath+m_data[i].combine,includes = m_data[i].include;
										   
										   var end = (i==m_data.length-1)?true:false;
										   
										   mg.merge({
										         request:request,
												 response:response,
												 root:config.ROOT,
												 args:includes,
												 type:m_type,
												 errorFun:status.status404,
												 direct:false,
												 compress:true,
												 ifend:end,
												 path:path
										   }).mergeAll();

									  }
								   
								  }*/					  
						  }
					 }).mergeAll();
				}
				else {
					//404错误
					status.status404(response);
				}
		   }
		   //文件夹或是文件的读取
		   else {
			  if(stats.isFile()) {
				   var ext = path.extname(realpath);
				   ext = ext?ext:'unknown';
				   var contentType = mime[ext] || 'text/plain';
				   response.setHeader('Content-Type',contentType);
				   fs.readFile(realpath,'binary',function(err,file){
				            if(err) {
							     status.status500(response);
							}
							else {
							     if(needMerge) {
									 console.log(realpath);
					                 utils.xmlToJson({
					                      files:mergePath,
					                      typer:mergeType,
										  root:config.ROOT,
					                      callback:function(data){
					                            mg.merge({
									              request:request,
									              response:response,
									              type:mergeType,
									              deploy:data,
									              path:realpath,
												  root:config.ROOT,
									              filter:config.ROOT+config.minPath,
									              errorFun:status.status404,
									              direct:true,
									              compress:config.Compress			      
							                    }).init();
					                   }
					                 }).init();									 
								 }
								 else {
									 status.status200(response,contentType,file,'binary');
								 }
							}
				   });
			  }
			  else if(stats.isDirectory()){
				     status.status200(response,'text/html',utils.listFolder(realpath,config.ROOT+config.staticPath));
			  }
		   }
	});
	
}).listen(config.PORT);

console.log('Server running at http://127.0.0.1:'+config.PORT);
