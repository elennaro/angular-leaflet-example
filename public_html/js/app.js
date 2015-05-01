var app = angular.module("lfl", ["leaflet-directive"])
				.controller("map", ['$scope', 'pip', 'geoCode', function($scope, pip, geoCode) {
						angular.extend($scope, {
							addr: "",
							center: {
								autoDiscover: true
							},
							defaults: {
								center: {
									lat: 41.7244367905198,
									lng: 44.73508358001709,
									zoom: 18
								},
								scrollWheelZoom: true
							},
							paths: {
								area: {
									type: "multiPolygon",
									color: 'red',
									weight: 2,
									opacity: 0.2,
									latlngs: [[{ lat: 41.728756432210275, lng: 44.70320391628775 },
											{ lat: 41.71613619940387, lng: 44.703804731107084 },
											{ lat: 41.71917937570911, lng: 44.74860835049185 },
											{ lat: 41.71290066445229, lng: 44.78088068935904 },
											{ lat: 41.71661243937697, lng: 44.78612279839581 },
											{ lat: 41.73615018176538, lng: 44.77118825860089 },
											{ lat: 41.728756432210275, lng: 44.70320391628775 }]]
								}
							},
							events: {
								map: {
									enable: ['moveend'],
									logic: 'emit'
								}
							}
						});
						$scope.$on('leafletDirectiveMap.moveend', function(evt, llEvt) {
							var center = [llEvt.model.center.lat, llEvt.model.center.lng],
											zoom = llEvt.model.center.zoom,
											poly = llEvt.model.paths.area.latlngs[0].map(function(p) {
								return [p.lat, p.lng];
							}),
											inPoly = pip.inPoly(center, poly);
							if (zoom < 17)
								$scope.addr = "ENLARGE!";
							else if (!inPoly)
								$scope.addr = "REturn";
							else
								geoCode.reverse(center).then(function(addr) {
									$scope.addr = addr;
								});
						});
					}])
				.service('pip', [function() {
						return {
							inPoly: function(point, poly) {
								// ray-casting: http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html

								var x = point[0], y = point[1];
								var inside = false;
								for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
									var xi = poly[i][0], yi = poly[i][1];
									var xj = poly[j][0], yj = poly[j][1];
									var intersect = ((yi > y) !== (yj > y))
													&& (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
									if (intersect) inside = !inside;
								}

								return inside;
							}
						};
					}])
				.service('geoCode', ['$http', '$q', function($http, $q) {
						var lastRequestTime = new Date();
						return {
							reverse: function(latLng) {
								var deferred = $q.defer();
								$http.get('http://nominatim.openstreetmap.org/reverse', { params: {
										format: 'json',
										lat: latLng[0],
										lon: latLng[1],
										zoom: 20,
										addressdetails: 1
									} })
												.success(function(data) {
													console.log(data);
													console.log(data.address);
													deferred.resolve(data.display_name);
												})
												.error(function(error) {
													deferred.reject(error);
												});
								return deferred.promise;
							}
						}
					}]);