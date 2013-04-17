/*
 *状态显示
 */

exports.status404 = function(response) {
       response.writeHead(404,{
			'Content-Type':'text/html'
			});
	   response.end('<h1>404,NOT FOUND PAGE!</h1>');
};

exports.status500 = function(response) {
       response.writeHead(500, {'Content-Type': 'text/plain'})
	   response.end('<h1>500,Server Error!</h1>');
};


exports.status200 = function(response,contentType,context,format) {
		response.writeHead(200, {'Content-Type':contentType});
		response.write(context,format);
		response.end();
};

