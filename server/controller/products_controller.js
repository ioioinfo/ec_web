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
//根据id找到商品所有评论数量
var find_total_comments = function(product_id, cb){
	var url = "http://139.196.148.40:16001/get_product_comments_summary?product_id=";
	url = url + product_id;
	do_get_method(url,cb);
};
//根据id找到评论
var find_comments_info = function(product_id, cb){
	var url = "http://127.0.0.1:8060/comments_show?product_id=";
	url = url + product_id;
	do_get_method(url,cb);
};
//根据personid找到人
var find_comments_persons = function(comments_persons, cb){
	var url = "http://127.0.0.1:8060/comments_persons?person_ids=";
	url = url + comments_persons;
	do_get_method(url,cb);
};
//根据评论找晒单
var find_saidans_pictures = function(comments_ids, cb){
	var url = "http://127.0.0.1:8060/comments_saidan?comments_ids=";
	url = url + comments_ids;
	do_get_method(url,cb);
};
//根据产品id找产品详细
var find_product_details = function(product_id, cb){
	var url = "http://127.0.0.1:7000/get_product_details?product_id=";
	url = url + product_id;
	do_get_method(url,cb);
};
//查找商品分类
var find_sorts = function(cb){
	var url = "http://127.0.0.1:8050/search_sorts";
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

						var ep =  eventproxy.create("pictures","industry_info","stock","sales","same_pictures","total_comments","comments","persons","saidans","product_details",
							function(pictures,industry_info,stock,sales,same_pictures,total_comments,comments,persons,saidans,product_details){
							return reply.view(industry["view_name"],{"product":product,"pictures":pictures,"industry":industry,"industry_info":industry_info,"stock":stock,"sales":sales,"same_pictures":same_pictures,"total_comments":total_comments,"comments":comments,"persons":persons,"saidans":saidans,"product_details":product_details})
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
							}else {
								ep.emit("stock",{"properties":{},"stocks":{}});
							}
						});
						find_pictures_byId(product_id, function(err, content){
							if (!err) {
								var pictures = content.rows;
								ep.emit("pictures", pictures);
							}else {
								ep.emit("pictures", {});
							}
						});
						find_product_sales(product_id, function(err, content){
							if (!err) {
								var sales = content.row;
								ep.emit("sales", sales);
							}else {
								ep.emit("sales", {});
							}
						});
						find_total_comments(product_id, function(err, content){
							if (!err) {
								var total_comments = content.row;
								ep.emit("total_comments", total_comments);
							}else {
								ep.emit("total_comments", {});
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
						find_comments_info(product_id, function(err, content){
							if (!err) {
								var comments = content.rows;
								var comments_ids = [];
								var comments_persons = [];
								if (comments) {
									for (var i = 0; i < comments.length; i++) {
										comments_ids.push(comments[i].id);
										comments_persons.push(comments[i].person_id);
									}
									comments_persons = JSON.stringify(comments_persons);
									comments_ids = JSON.stringify(comments_ids);
									var eproxy =  eventproxy.create("persons","saidans",
										function(persons,saidans){
											ep.emit("comments", comments);
											var person_map = {};
											var saidan_map = {};
											for (var i = 0; i < persons.length; i++) {
												person_map[persons[i].id] = persons[i];
											}
											if (saidans) {
												for (var i = 0; i < saidans.length; i++) {
													var saidan = saidans[i]; //一个晒单对象
													var comment_saidans = [];
													if (saidan_map[saidan.product_comments_id]) { //晒单评论id对应的不存在
														comment_saidans = saidan_map[saidan.product_comments_id]; //晒单 = 晒单产品id
													}
													comment_saidans.push(saidan); //晒单添加 晒单对象
													saidan_map[saidan.product_comments_id] = comment_saidans; //晒单评论id = 晒单
												}
											}
											ep.emit("persons", person_map);
											ep.emit("saidans", saidan_map);
									});
									find_comments_persons(comments_persons, function(err, content){
										if (!err) {
											var persons = content.rows;
											eproxy.emit("persons", persons);
										}else {
											eproxy.emit("persons", []);
										}
									});
									find_saidans_pictures(comments_ids, function(err, content){
										if (!err) {
											var saidans = content.rows;
											eproxy.emit("saidans", saidans);
										}else {
											eproxy.emit("saidans", []);
										}
									});
								}else {
									ep.emit("comments", []);
									ep.emit("persons", []);
									ep.emit("saidans", []);
								}
							}
							else {
								ep.emit("comments", []);
								ep.emit("persons", []);
								ep.emit("saidans", []);
							}
						});
						find_product_details(product_id, function(err, content){
							if (!err) {
								var  product_details = content.rows;
								ep.emit("product_details", product_details);
							}else {
								ep.emit("product_details", []);
							}
						});
					}else {
						return reply("404");
					}
				});
			}
		},
		{
			method: 'GET',
			path: '/search_result',
			handler: function(request, reply){
				find_sorts(function(err, content){
					if (!err) {
						var  sorts = content.rows;
						console.log("sorts: "+sorts);
						var level_map = {};
						for (var i = 0; i < sorts.length; i++) {
							var parent_id = sorts[i].parent.toString() ;
							var level_sorts = [];
							if (level_map[parent_id]) {
								level_sorts = level_map[parent_id];
							}
							level_sorts.push(sorts[i]);
							level_map[parent_id] = level_sorts;
						}
						console.log("level_map: "+JSON.stringify(level_map));
						return reply.view("search_result",{"sorts":level_map})
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
