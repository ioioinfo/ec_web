// Base routes for item..
﻿var industries = require('../utils/industries.js');
var eventproxy = require('eventproxy');
const uu_request = require('../utils/uu_request');

var do_get_method = function(url,cb){
	uu_request.get(url, function(err, response, body){
		if (!err && response.statusCode === 200) {
			var content = JSON.parse(body);
			cb(false, content.data);
		} else {
			cb(true, null);
		}
	});
};
//通过商品id查找到商品
var find_product_byId = function(product_id, cb){
	var url = "http://127.0.0.1:7000/product_info?product_id=";
	url = url + product_id;
	do_get_method(url,cb);
};
//通过商品id找到图片
var find_pictures_byId = function(product_id, cb){
	var url = "http://127.0.0.1:7000/products_pictures?product_id=";
	url = url + product_id;
	do_get_method(url,cb);
};
//通过商品id，行业id找到行业信息
var find_industry = function(industry_id,product_id, cb){
	var url = "http://127.0.0.1:7000/products_industries?product_id=";
	url = url + product_id + "&industry_id=" + industry_id;
	do_get_method(url,cb);
};
//查询库存
var find_stock = function(industry_id,product_id,stock_options,cb){
	var url = "http://139.196.148.40:12001/get_product_stock_for_view?product_id=";
	url = url + product_id + "&industry_id=" + industry_id + "&stock_options=" +JSON.stringify(stock_options);
	uu_request.get(url, function(err, response, body){
		if (!err && response.statusCode === 200) {
			var content = JSON.parse(body);
			console.log(body);
			cb(false, content);
		} else {
			cb(true, null);
		}
	});
};
//查询销售量
var find_product_sales = function(product_id,cb){
	var url = "http://139.196.148.40:16001/get_product_sales?product_id=";
	url = url + product_id;
	uu_request.get(url, function(err, response, body){
		if (!err && response.statusCode === 200) {
			var content = JSON.parse(body);
			console.log(content);
			cb(false, content);
		} else {
			cb(true, null);
		}
	});
};
exports.register = function(server, options, next){

	server.route([
		{
			method: 'GET',
			path: '/product_info',
			handler: function(request, reply){
				var product_id = 1;
				find_product_byId(product_id, function(err, content){
					if (!err) {
						var industry_id = content.industry_id;
						var industry = industries[industry_id];
						var stock_options = {"region_id":"1"};

						var ep =  eventproxy.create("pictures","industry_info","stock","sales",
							function(pictures,industry_info,stock,sales){
							return reply.view(industry["view_name"],{"product":content,"pictures":pictures,"industry":industry,"industry_info":industry_info,"stock":stock,"sales":sales})
						});
						find_industry(industry_id,product_id, function(err, content){
							if (!err) {
								var industry_info = content;
								ep.emit("industry_info", industry_info);
							}
						});
						find_stock(industry_id,product_id,stock_options,function(err, content){
							if (!err) {
								var stocks = content.stocks;
								var properties = content.properties;
								ep.emit("stock",{"properties":properties,"stocks":stocks});
							}
						});
						find_pictures_byId(product_id, function(err, content){
							if (!err) {
								var pictures = content;
								ep.emit("pictures", pictures);
							}
						});
						find_product_sales(product_id, function(err, content){
							if (!err) {
								console.log("sales:"+content.row.total_number);
								var sales = content.row;
								ep.emit("sales", sales);
							}
						});
					}else {
					}
				});
			}
		},

    ]);

    next();
};

exports.register.attributes = {
    name: 'products_base'
};
