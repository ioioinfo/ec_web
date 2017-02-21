// Base routes for item..

const uu_request = require('../utils/uu_request');

exports.register = function(server, options, next){

	//获取当前cookie login_id
	var get_cookie_loginId = function(request, cb){
		var login_id;
		if (request.state && request.state.cookie) {
			state = request.state.cookie;
			if (state.login_id) {
				login_id = state.login_id;
			}
		}
		cb(login_id);
	};

	var do_post_method = function(data,url,cb){
		uu_request.request(url, data, function(err, response, body) {
			console.log(body);
			if (!err && response.statusCode === 200) {
				cb(false,body);
			} else {
				cb(true,null);
			}
		});
	};
	//注册
	var do_register = function(data, cb){
		url = "http://139.196.148.40:18666/user/register";
		do_post_method(data,url,cb);
	};
	//登入
	var do_login = function(data, cb){
		url = "http://139.196.148.40:18666/user/login_check";
		do_post_method(data,url,cb);
	};

	server.route([
		{
			method: 'GET',
			path: '/login',
			handler: function(request, reply){
				return reply.view('login');
			}
		},
		{
			method: 'GET',
			path: '/register',
			handler: function(request, reply){
				return reply.view('register');
			}
		},
		//用户界面
		{
			method: 'GET',
			path: '/person',
			handler: function(request, reply){
				get_cookie_loginId(request, function(login_id){
					if (!login_id) {
						return reply.redirect("/login");
					}

					return reply.view('personalcenter');
				});
			}
		},
		{
			method: 'GET',
			path: '/product',
			handler: function(request, reply){
				return reply.view('product');
			}
		},
		//注册
		{
			method: 'POST',
			path: '/register_submit',
			handler: function(request, reply){
				var data = {};
				data.username = request.payload.username;
				data.password = request.payload.password;
				data.mobile = request.payload.mobile;
				data.org_code = "yoyo";

				do_register(data,function(err,rows){
					if (!err) {
						return reply({"success":true});
					}else {
						return reply({"success":false});
					}
				});

			}
		},
		//登入
		{
			method: 'POST',
			path: '/login_submit',
			handler: function(request, reply){
				var data = {};
				data.username = request.payload.username;
				data.password = request.payload.password;
				data.org_code = "ioio";

				do_login(data,function(err,row){
					if (!err) {
						var login_id = row.row.login_id;
						console.log(login_id);
						var state = {login_id:login_id};
						return reply({"success":true}).state('cookie', state, {ttl:10*365*24*60*60*1000});

					}else {
						return reply({"success":false});
					}
				});

			}
		},


    ]);

    next();
};

exports.register.attributes = {
    name: 'user_controller'
};
