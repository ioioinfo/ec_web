// Base routes for item..
﻿var industries = require('../utils/industries.js');
var eventproxy = require('eventproxy');
const uu_request = require('../utils/uu_request');

var do_get_method = function(url,cb){
	uu_request.get(url, function(err, response, body){
		if (!err && response.statusCode === 200) {
			var content = JSON.parse(body);
			cb(false, content);
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
	var url = "http://127.0.0.1:7000/get_product_pictures?product_id=";
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
	do_get_method(url,cb);
};
//查询销售量
var find_product_sales = function(product_id,cb){
	var url = "http://139.196.148.40:16001/get_product_sales?product_id=";
	url = url + product_id;
	do_get_method(url,cb);
};
//查询同类商品
var find_same_products = function(product_id, same_code, cb){
	console.log("same_code:"+same_code);
	var url = "http://127.0.0.1:7000/get_same_products?product_id=";
	url = url + product_id + "&same_code=" + same_code;
	do_get_method(url,cb);
};
//根据id找到商品小图片
var find_samll_picture = function(same_product_ids, cb){
	var url = "http://127.0.0.1:7000/get_products_picture?product_ids=";
	url = url + JSON.stringify(same_product_ids);
	do_get_method(url,cb);
};
exports.register = function(server, options, next){

	server.route([
		{
			method: 'GET',
			path: '/product_info',
			handler: function(request, reply){
				var product_id = request.query.product_id;
				if (!product_id) {
					return reply("404");
				}
				find_product_byId(product_id, function(err, content){
					if (!err) {
						var product = content.row;
						if (!product) {
							return reply("404");
						}
						var industry_id = product.industry_id;
						var same_code = product.same_code;
						var industry = industries[industry_id];
						var stock_options = {"region_id":"1"};

						var ep =  eventproxy.create("pictures","industry_info","stock","sales","same_pictures",
							function(pictures,industry_info,stock,sales,same_pictures){
							return reply.view(industry["view_name"],{"product":product,"pictures":pictures,"industry":industry,"industry_info":industry_info,"stock":stock,"sales":sales,"same_pictures":same_pictures})
						});
						find_industry(industry_id,product_id, function(err, content){
							if (!err) {
								var industry_info = content.row;
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
								var pictures = content.rows;
								ep.emit("pictures", pictures);
							}
						});
						find_product_sales(product_id, function(err, content){
							if (!err) {
								var sales = content.row;
								ep.emit("sales", sales);
							}
						});
						find_same_products(product_id, same_code, function(err, content){
							if (!err) {
								var same_products = content.rows;
								var same_product_ids = [];
								if (same_products) {
									for (var i = 0; i < same_products.length; i++) {
										same_product_ids.push(same_products[i].id);
									}
									console.log("same_product_ids: "+same_product_ids);
									find_samll_picture(same_product_ids, function(err, content){
										if (!err) {
											var same_pictures = content.rows;
											console.log(same_pictures);
											ep.emit("same_pictures", same_pictures);
										} else {
											ep.emit("same_pictures", []);
										}
									});
								}else {
									ep.emit("same_pictures", []);
								}
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