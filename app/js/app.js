angular.module('scoreApp', ['ui.bootstrap', 'ngCookies', 'ngRoute'])
	.config(['$routeProvider', '$locationProvider', '$httpProvider', function($routeProvider, $locationProvider, $httpProvider) {
		$httpProvider.responseInterceptors.push('authInterceptor');

		$routeProvider
			.when('/', {
				templateUrl: '/partials/splash.html',
				controller: 'SplashCtrl'
			})
			.when('/tournament/:tournamentID/dashboard', {
					templateUrl: '/partials/tournament/dashboard.html',
					controller: 'TournamentDashCtrl'
				})
			.when('/organization/:organizationID/dashboard', {
					templateUrl: '/partials/organization/dashboard.html',
					controller: 'OrganizationDashCtrl'
				})
			.when('/login', {
					templateUrl: '/partials/account/loginPage.html',
					controller: 'AccountLoginPageCtrl'
				})
			.when('/account/update', {
					templateUrl: '/partials/account/update.html',
					controller: 'AccountUpdateCtrl'
				})
			.when('/official/:officialID/info', {
					templateUrl: '/partials/official/info.html',
					controller: 'OfficialInfoCtrl'
				})
			.when('/official/lookup', {
				templateUrl:'/partials/official/lookup.html',
				controller: 'OfficialLookupCtrl'
				})
			.when('/tournament/:tournamentID/scoring/:eventDivision/:eventName', {
					templateUrl: '/partials/scoring/event.html',
					controller: 'EventScoringCtrl'
				})
			.when('/tournament/:tournamentID/presentation', {
					templateUrl: '/partials/presentation/presentation.html',
					controller: 'PresentationCtrl'
				})
			.when('/tournament/:tournamentID/:division/scoresheet', {
					templateUrl: '/partials/scoring/tournament.html',
					controller: 'TournamentScoringCtrl'
				})
			.when('/401', {
					templateUrl: '/partials/denied.html'
				})
			;

		$locationProvider.html5Mode(true).hashPrefix('!');
}]);

angular.module('scoreApp').controller('NavbarCtrl', ['$scope', 'api', '$modal', '$rootScope', '$location', 'user', 'alert', function($scope, api, $modal, $rootScope, $location, user, alert) {
	$scope.user = {};

	$scope.getUser = function() {
		user.current().then(function(user) {
			$scope.user = user;
			api.getUserOrganizations(user).then(function(organizations) {
				$scope.user.organizations = organizations;
			}, function(err) {
				alert.danger(err);
			});
		});
	};

	$scope.getUser();

	$rootScope.$on('login', function() {
		$scope.getUser();
	});

	$rootScope.$on('updateUser', function() {
		$scope.getUser();
	});

	$scope.openLogin = function() {
		var loginForm = $modal.open({
			templateUrl: '/partials/account/login.html',
			controller: 'AccountLoginCtrl'
		});

		loginForm.result.then(function() {
			$scope.getUser();
		});
	};

	$scope.logout = function() {
		api.logout().then(function(msg) {
			alert.success(msg);
			$scope.getUser();
		}, function(err) {
			alert.danger(err);
		});
	};

	$scope.createOrganization = function() {
		var newOrganization = $modal.open({
			templateUrl: '/partials/organization/new.html',
			controller: 'OrganizationCreateCtrl'
		});

		newOrganization.result.then(function(organization) {
			$scope.user.organizations.push(organization);
			$location.path('/organization/' + organization.id + '/dashboard');
		});
	};
	
	$scope.createOfficial = function() {
		var newOfficial = $modal.open({
			templateUrl: '/partials/official/new.html',
			controller: 'OfficialCreateCtrl'
		});
	};
}]);

angular.module('scoreApp').controller('PageCtrl', ['$scope', '$rootScope', '$http', function($scope, $rootScope, $http) {

	$http({
		method: 'GET',
		url: '/account/current'
	}).success(function(res) {
		$rootScope.username = res.username;
	}).error(function(err) {
		console.log(err);
	});

}]);
angular.module('scoreApp').controller('SplashCtrl', ['$scope', '$location', 'api', 'userCache', function($scope, $location, api, userCache) {

	var user = userCache.get();

	if (user.username) {
		api.getUserOrganizations(user).then(function(organizations) {
			if (organizations.length > 0) {
				$location.path('/organization/' + organizations[0].id + '/dashboard');
			}
		});
	}

}]);

angular.module('scoreApp').controller('AccountCreateCtrl',
	['$scope', 'api', 'alert', 'user', function($scope, api, alert, user) {

	$scope.form = {};

	$scope.createAccount = function() {
		api.createAccount($scope.form).then(function(msg) {
			alert.success(msg);
		}, function(err) {
			alert.danger(err);
		});
	};
}]);

angular.module('scoreApp').controller('AccountLoginCtrl',
	['$scope', '$rootScope', 'api', '$modalInstance', 'alert', 'user',
		function($scope, $rootScope, api, $modalInstance, alert, user) {
	
	$scope.form = {};

	$scope.login = function() {
		api.login($scope.form).then(function(msg) {
			alert.success(msg);
			user.current().then(function(res) {
				$modalInstance.close();
			});
		}, function(err) {
			alert.danger(err);
		});
	};

	$scope.close = function() {
		$modalInstance.dismiss('cancel');
	};

}]);

angular.module('scoreApp').controller('AccountLoginPageCtrl', ['$scope', 'api', '$location', '$routeParams', '$rootScope', 'alert', function($scope, api, $location, $routeParams, $rootScope, alert) {
	$scope.form = {};

	$scope.login = function() {
		api.login($scope.form).then(function(msg) {
			if ($routeParams.redirect) {
				$location.url($routeParams.redirect);
			} else {
				console.log('no redirect :(');
			}
			$rootScope.$emit('login');
		}, function(err) {
			alert.danger(err);
		});
	};

}]);

angular.module('scoreApp').controller('AccountUpdateCtrl',
	['$scope', 'api', 'alert', 'user', function($scope, api, alert, user) {

	$scope.form = {};

	$scope.updatePassword = function() {
		api.updatePassword($scope.form).then(function(msg) {
			alert.success(msg);
		}, function(err) {
			alert.error(err);
		});
	};

	$scope.updateEmail = function() {
		api.updateEmail($scope.form).then(function(msg) {
			alert.success(msg);
		}, function(err) {
			alert.danger(err);
		});
	};
}]);

angular.module('scoreApp').controller('EventListingCtrl', ['$scope', '$http', '$routeParams', '$filter', '$modal', '$window', 'alert', 'tournament', function($scope, $http, $routeParams, $filter, $modal, $window, alert, tournament) {
	$http({
		method: 'GET',
		url: '/tournament/' + $routeParams.tournamentID + '/events'
	}).success(function(events) {
		$scope.divisions = [
			{
				level: 'A',
				events: $filter('division')(events, 'A')
			}, {
				level: 'B',
				events: $filter('division')(events, 'B')
			}, {
				level: 'C',
				events: $filter('division')(events, 'C')
			}
		];
	}).error(function(err) {
		alert.danger(err);
	});

	$scope.addEvent = function() {
		var addEventModal = $modal.open({
			templateUrl: '/partials/tournament/newevent.html',
			controller: 'TournamentAddEventCtrl'
		});

		addEventModal.result.then(function(event) {
			$scope.divisions.forEach(function(division) {
				if(division.level === event.division) {
					division.events.push(event);
				}
			});
		});
	};

	$scope.removeEvent = function($event, event) {
		if($window.confirm('Are you sure you want to remove ' + event.eventName + '?')) {
			$http({
				method: 'POST',
				url: '/event/remove',
				data: {
					tournamentID: $routeParams.tournamentID,
					eventName: event.eventName,
					division: event.division
				}
			}).success(function(res) {
				$scope.divisions.forEach(function(division) {
					for(var i = division.events.length - 1; i >= 0; i--) {
						if(division.events[i].eventName === event.eventName &&
							division.events[i].division === event.division) {
							division.events.splice(i, 1);
						}
					}
				});
				alert.success(event.eventName + ' successfully removed');
			}).error(function(err) {
				alert.danger(err);
			});
		}

		if ($event.stopPropagation) $event.stopPropagation();
		if ($event.preventDefault) $event.preventDefault();
		$event.cancelBubble = true;
		$event.returnValue = false;
	};
}]);
angular.module('scoreApp').controller('OfficialCreateCtrl', ['$scope', '$window', '$http', '$modalInstance', 'alert', function($scope, $window, $http, $modalInstance, alert) {
	$scope.form = {};
	
	$scope.createOfficial = function() {
		$http({
			method:'POST',
			url:'/official/create',
			data:$scope.form
		}).success(function(res) {
			$modalInstance.dismiss('success');
			alert.success('New official created successfully!');
		}).error(function(err) {
			console.log(err);
			$scope.errorMessage = err;
		});
	};
	
	$scope.cancel = function() {
		$modalInstance.dismiss('cancel');
	};
}]);
angular.module('scoreApp').controller('OfficialEditCtrl', ['$scope', '$http', '$modalInstance', 'official', 'alert', function($scope, $http, $modalInstance, official, alert) {
	var editOfficial = official.get();
	$scope.form = {
		name_first:editOfficial.name_first,
		name_last:editOfficial.name_last,
		officialID:editOfficial.officialID,
		phone:editOfficial.phone,
		email:editOfficial.email
	};
	
	$scope.cancel = function() {
		$modalInstance.dismiss('cancel');
	};
	
	$scope.updateOfficial = function() {
		$http({
			method:'POST',
			url:'/official/update',
			data:$scope.form
		}).success(function(data) {
			editOfficial.name_first = $scope.form.name_first;
			editOfficial.name_last = $scope.form.name_last;
			editOfficial.phone = $scope.form.phone;
			editOfficial.email = $scope.form.email;
			$modalInstance.dismiss('success');
			alert.success('Successfully updated official!');
		}).error(function(err) {
			console.log('Error updating official');
			$scope.errorMessage = err;
		});
	};
}]);
angular.module('scoreApp').controller('OfficialInfoCtrl', ['$scope', '$http', '$routeParams', '$location', '$modal', '$window', 'official', 'alert', function($scope, $http, $routeParams, $location, $modal, $window, official, alert) {
	$scope.supervisedEvents = [];
	$scope.writtenEvents = [];
	
	$http({
		method:'GET',
		url:'/official/' + $routeParams.officialID + '/getbyid'
	}).success(function(data) {
		$scope.official = data;
		$scope.official.officialID = $routeParams.officialID;
	}).error(function(err) {
		console.log('Error getting official');
	});
	
	$http({
		method:'GET',
		url:'/official/' + $routeParams.officialID + '/coachedteams'
	}).success(function(data) {
		$scope.coachedTeams = data;
	}).error(function(err) {
		console.log('Error getting coached teams');
	});
	
	$http({
		method:'GET',
		url:'/official/' + $routeParams.officialID + '/writtenevents'
	}).success(function(data) {
		$scope.writtenEvents = data;
	}).error(function(err) {
		console.log('Error getting written events');
	});
	
	$http({
		method:'GET',
		url:'/official/' + $routeParams.officialID + '/supervisedevents'
	}).success(function(data) {
		$scope.supervisedEvents = data;
	}).error(function(err) {
		console.log('Error getting supervised events');
	});
	
	$scope.followPath =  function(path) {
		console.log(path);
		$location.path(path);
	};
	
	$scope.editOfficial = function() {
		official.set($scope.official);
		$modal.open({
			templateUrl:'/partials/official/edit.html',
			controller:'OfficialEditCtrl'
		});
	};
	
	$scope.removeOfficial = function() {
		if($window.confirm('Are you sure you want to delete ' + $scope.official.name_first + ' ' +  $scope.official.name_last + ' (cannot be undone)?')) {
			$http({
				method:'POST',
				url:'/official/remove',
				data:$scope.official
			}).success(function(data) {
				console.log(data);
				alert.success('Removed ' + $scope.official.name_first + ' ' +  $scope.official.name_last + ' from system.');
				$scope.followPath('/official/lookup');
			}).error(function(err) {
				alert.danger(err);
			});
		}
	};
}]);
angular.module('scoreApp').controller('OfficialLookupCtrl', ['$scope', '$http', function($scope, $http) {
	$http({
		method:'GET',
		url:'/official/all'
	}).success(function(data) {
		$scope.officials = data;
	}).error(function(err) {
		console.log('Could not Get Officials');
	});
}]);
angular.module('scoreApp').controller('OrganizationCreateCtrl', ['$scope', '$http', '$modalInstance', 'alert', function($scope, $http, $modalInstance, alert) {
	$scope.form = {};

	$scope.cancel = function() {
		$modalInstance.dismiss('cancel');
	};

	$scope.createOrganization = function() {
		$http({
			method: 'POST',
			url: '/organization/create',
			data: $scope.form
		}).success(function(organization) {
			$modalInstance.close(organization);
			alert.success('Successfully created organization');
		}).error(function(err) {
			alert.danger(err);
		});
	};
}]);
angular.module('scoreApp').controller('OrganizationDashCtrl', ['$scope', '$http', '$routeParams', '$modal', '$window', 'alert', function($scope, $http, $routeParams, $modal, $window, alert) {
	$http({
		method: 'GET',
		url: '/organization/' + $routeParams.organizationID + '/info'
	}).success(function(res) {
		$scope.organization = res;
	}).error(function(err) {
		alert.danger(err);
	});

	$http({
		method: 'GET',
		url: '/organization/' + $routeParams.organizationID + '/admins'
	}).success(function(res) {
		$scope.admins = res;
	}).error(function(err) {
		alert.danger(err);
	});

	$http({
		method: 'GET',
		url: '/organization/' + $routeParams.organizationID + '/tournaments'
	}).success(function(res) {
		$scope.tournaments = res;
	}).error(function(err) {
		alert.danger(err);
	});

	$scope.addTournament = function() {
		var newTournament = $modal.open({
			templateUrl: '/partials/tournament/new.html',
			controller: 'TournamentCreateCtrl',
			resolve: {
				organizationID: function() {
					return $routeParams.organizationID;
				}
			}
		});

		newTournament.result.then(function(tournament) {
			$scope.tournaments.push(tournament);
		});
	};

	$scope.newAdmin = {
		active: false,
		username: '',
		submit: function() {
			$http({
				method: 'POST',
				url: '/organization/' + $routeParams.organizationID + '/admins/add',
				data: {
					username: $scope.newAdmin.username
				}
			}).success(function(account) {
				$scope.admins.push(account);
				$scope.newAdmin.active = false;
			}).error(function(err) {
				alert.danger(err);
			});
		}
	};

	$scope.removeAdmin = function(account) {
		if($window.confirm('Are you sure you want to remove ' + account.username + ' from ' + $scope.organization.name + '?')) {
			$http({
				method: 'POST',
				url: '/organization/' + $routeParams.organizationID + '/admins/remove',
				data: {
					username: account.username
				}
			}).success(function(account) {
				for(var i = 0; i < $scope.admins.length; i++) {
					if($scope.admins[i].username === account.username) {
						$scope.admins.splice(i, 1);
					}
				}
				alert.success(account.username + ' successfully removed');
			}).error(function(err) {
				alert.danger(err);
			});
		}
	};

	$scope.removeTournament = function($event, tournament) {
		if($window.confirm('Are you sure you want to remove ' + tournament.name + ' from ' + $scope.organization.name + '? This cannot be undone!')) {
			$http({
				method: 'POST',
				url: '/tournament/remove',
				data: {
					tournamentID: tournament.id
				}
			}).success(function() {
				for(var i = 0; i < $scope.tournaments.length; i++) {
					if($scope.tournaments[i].id === tournament.id) {
						$scope.tournaments.splice(i, 1);
					}
				}
				alert.success(tournament.name + ' successfully removed');
			}).error(function(err) {
				alert.danger(err);
			});
		}

		if ($event.stopPropagation) $event.stopPropagation();
		if ($event.preventDefault) $event.preventDefault();
		$event.cancelBubble = true;
		$event.returnValue = false;
	};

	$scope.updateOrganization = function() {
		var updateOrganization = $modal.open({
			templateUrl: '/partials/organization/update.html',
			controller: 'OrganizationUpdateCtrl',
			resolve: {
				organization: function() {
					return $scope.organization;
				}
			}
		});

		updateOrganization.result.then(function(org) {
			$scope.organization = org;
		});
	};
}]);
angular.module('scoreApp').controller('OrganizationUpdateCtrl', ['$scope', '$rootScope', '$http', '$modalInstance', 'alert', '$location', '$window', 'organization', function($scope, $rootScope, $http, $modalInstance, alert, $location, $window, organization) {
	$scope.organization = organization;
	$scope.form = {
		name: organization.name
	};

	$scope.updateOrganization = function() {
		$http({
			method: 'POST',
			url: '/organization/update',
			data: {
				name: $scope.form.name,
				id: organization.id
			}
		}).success(function(org) {
			alert.success('Organization successfully updated');
			$rootScope.$emit('updateUser');
			$modalInstance.close(org);
		}).error(function(err) {
			alert.danger(err);
		});
	};

	$scope.removeOrganization = function() {
		if($window.confirm('Are you sure you want to remove ' + organization.name + '? This cannot be undone!')) {
			$http({
				method: 'POST',
				url: '/organization/remove',
				data: {
					orgID: organization.id
				}
			}).success(function() {
				alert.success($scope.organization.name + ' successfully removed');
				$rootScope.$emit('updateUser');
				$location.path('/');
				$modalInstance.dismiss('cancel');
			}).error(function(err) {
				alert.danger(err);
			});
		}
		$location.path('/account/update');
	};

	$scope.close = function() {
		$modalInstance.dismiss('cancel');
	};
}]);
angular.module('scoreApp').controller('PresentationCtrl', ['$scope', '$routeParams', '$q', 'tournament', 'api', function($scope, $routeParams, $q, tournament, api) {
	var element = document.getElementById("slide");

	$scope.events = {};
	$scope.currentIndex = 0;
	$scope.keysDisabled = false;
	$scope.results = {};

	var divisions = [];
	var overallDivisionIndex = 0;
	var overallRevealed = false;

	$scope.currentevent = null;

	$scope.inProgress = true;

	api.getTournamentInfo($routeParams.tournamentID).then(function(tournamentInfo) {
		$scope.tournament = tournamentInfo;

		$scope.placesLength = $scope.tournament.eventMedalCount;

		console.log($scope.tournament);

		$scope.entryHeight = 100/$scope.tournament.eventMedalCount - 6;
		tournament.set($scope.tournament);

		$scope.nextEvent();
	}, function(err) {});

	var containsEvent = function(arr, evt, remove) {
		var foundEvent = false;
		arr.forEach(function(entry, index) {
			if(entry.eventName == evt.eventName && entry.division == evt.division) {
				console.log("Contains event:", evt.eventName);
				foundEvent = true;
				if(remove) {
					arr.splice(index, 1);
				}
			}
		});
		if(foundEvent) {
			return true;
		} else {
			return false;
		}
	};

	var manageEventStatuses = function(events) {
		events.forEach(function(evt) {
			if($scope.events[evt.division] === undefined) {
				$scope.events[evt.division] = {
					presented: [],
					pending: [],
					unfinished: []
				};
			}
			if(evt.status === 'Completed' &&
					!containsEvent($scope.events[evt.division].presented, evt) &&
					!containsEvent($scope.events[evt.division].pending, evt)) {
				console.log("Adding", evt.eventName, "to pending");
				$scope.events[evt.division].pending.push(evt);
				$scope.events[evt.division].unfinished = $scope.events[evt.division].unfinished.filter(function(elem) {
					return elem.eventName !== evt.eventName;
				});
				containsEvent($scope.events[evt.division].unfinished, evt, true);
			} else if(evt.status !== 'Completed' && !containsEvent($scope.events[evt.division].unfinished, evt)) {
				$scope.events[evt.division].unfinished.push(evt);
			}
		});

		var sortByName = function(a, b) {
			if(a.eventName < b.eventName) return -1;
			else return 1;
		};

		divisions = [];
		for(var key in $scope.events) {
			divisions.push(key);
			$scope.events[key].pending.sort(sortByName);
		}
		divisions.sort();
	};

	$scope.nextEvent = function() {
		api.getEvents($routeParams.tournamentID).then(function(events) {
			manageEventStatuses(events);
			console.log("got events", $scope.events, "divisions", divisions);
			var iterations = 0;
			if(!$scope.currentevent) {
				for(var j = 0; j < divisions.length; j++) {
					console.log("iterating through division", divisions[j]);
					if($scope.events[divisions[j]].pending.length > 0) {
						console.log("found one");
						$scope.currentevent = $scope.events[divisions[j]].pending[0];
						if($scope.disabled) {
							$scope.disabled = false;
							element.focus();
						}
						break;
					}
				}
			} else {
				for(var p = 0; p < $scope.events[$scope.currentevent.division].pending.length; p++) {
					if($scope.events[$scope.currentevent.division].pending[p].eventName === $scope.currentevent.eventName) {
						$scope.events[$scope.currentevent.division].pending.splice(p, 1);
						console.log("removed old event", $scope.events[$scope.currentevent.division].pending);
						p--;
					}
				}
				$scope.events[$scope.currentevent.division].presented.push($scope.currentevent);
				var i = divisions.indexOf($scope.currentevent.division);
				console.log("setting null");
				$scope.currentevent = null;
				console.log($scope.events);
				for(var k = 0; k < divisions.length; k++) {
					if(++i === divisions.length) i = 0;
					if($scope.events[divisions[i]].pending.length > 0) {
						$scope.currentevent = $scope.events[divisions[i]].pending[0];
						break;
					}
				}
			}
			if($scope.currentevent !== null) {
				api.getEventScores($routeParams.tournamentID, $scope.currentevent.division, $scope.currentevent.eventName).then(function(evt) {
					evt.participators.sort(function(a, b) {
						if(a.place < b.place) {
							return -1;
						} else if(a.place > b.place) {
							return 1;
						} else {
							return 0;
						}
					});
					$scope.currentevent.topTeams = [];
					for(var i = 0; i < Number($scope.tournament.eventMedalCount); i++) {
						evt.participators[i].revealed = false;
						$scope.currentevent.topTeams.unshift(evt.participators[i]);
					}
				}, function(err) {});
			} else {
				var unfinished = false;
				for(var division in $scope.events) {
					console.log("pending", $scope.events[division].pending);
					console.log("unfinished", $scope.events[division].unfinished);
					if($scope.events[division].pending.length > 0 || $scope.events[division].unfinished.length > 0) {
						unfinished = true;
					}
				}
				if(unfinished) {
					$scope.disabled = true;
				} else {
					$scope.inProgress = false;
					divisions.forEach(function(division, index) {
						finalScores(division, index === 0);
					});
				}
			}
		});
	};

	var finalScores = function(division, setCurrent) {
		api.getOverallTeamRankings($routeParams.tournamentID, division).then(function(rankings) {
			$scope.results[division] = {};
			$scope.results[division].eventName = "Overall Results";
			$scope.results[division].division = division;
			$scope.results[division].currentIndex = 0;
			$scope.results[division].teams = [];
			rankings.forEach(function(entry) {
				if($scope.results[division].teams[entry.team.number] === undefined) {
					$scope.results[division].teams.push({
						name: entry.team.name,
						school: entry.team.school,
						number: entry.team.number,
						totalScore: 0,
						firsts: 0
					});
				}

				$scope.results[division].teams.forEach(function(team) {
					if(team.number === entry.team.number) {
						team.totalScore += entry.place;
						if(entry.place === 1) {
							team.firsts++;
						}
					}
				});
			});

			$scope.results[division].teams.sort(function (a, b) {
				if(a.totalScore < b.totalScore) {
					return -1;
				} else if(a.totalScore > b.totalScore) {
					return 1;
				} else if(a.firsts > b.firsts) {
					return -1;
				} else if(a.firsts < b.firsts) {
					return 1;
				} else {
					return 0;
				}
			});

			var currentIndex = 0;
			console.log($scope.results[division].teams);
			$scope.results[division].topTeams = [];
			for(var i = 1; i <= Number($scope.tournament.overallTrophyCount); i++) {
				if($scope.tournament.oneTrophyPerSchool) {
					while($scope.results[division].topTeams.some(function(elem) { return elem.school === $scope.results[division].teams[currentIndex].school; })) {
						currentIndex++;
					}
					$scope.results[division].topTeams.unshift({
						team: {
							name: $scope.results[division].teams[currentIndex++].school
						},
						place: i
					});
				} else {
					$scope.results[division].topTeams.unshift({
						revealed: false,
						team: {
							name: $scope.results[division].teams[currentIndex].name,
							division: division,
							number: $scope.results[division].teams[currentIndex].number
						},
						place: i
					});
					currentIndex++;
				}
			}

			if(setCurrent) {
				$scope.placesLength = $scope.tournament.overallTrophyCount;
				$scope.entryHeight = 100/$scope.tournament.overallTrophyCount - 6;
				$scope.currentevent = $scope.results[division];
				console.log($scope.currentevent);
			}

		}, function(err) {});
	};

	$scope.launchFullscreen = function() {
		if(element.requestFullscreen) {
			element.requestFullscreen();
		} else if(element.mozRequestFullScreen) {
			element.mozRequestFullScreen();
		} else if(element.webkitRequestFullscreen) {
			console.log("requesting fullscreen");
			element.webkitRequestFullscreen();
		} else if(element.msRequestFullscreen) {
			element.msRequestFullscreen();
		}

		element.focus();
	};

	$scope.reveal = function() {
		console.log("revealing");
		if($scope.inProgress) {
			$scope.currentevent.topTeams[$scope.currentIndex].revealed = true;
		} else {
			if(!overallRevealed) {
				console.log($scope.currentIndex);
				$scope.currentevent.topTeams[$scope.currentevent.currentIndex++].revealed = true;
				overallRevealed = true;
			} else if(!($scope.currentevent.division === divisions[divisions.length - 1] && $scope.currentevent.currentIndex === $scope.tournament.overallTrophyCount)) {
				if(overallDivisionIndex === divisions.length - 1) {
					overallDivisionIndex = 0;
				} else {
					overallDivisionIndex++;
				}
				overallRevealed = false;
				$scope.currentevent = $scope.results[divisions[overallDivisionIndex]];
			}
			$scope.currentIndex = 0;
		}
		console.log("Current index:", $scope.currentIndex);
	};

	$scope.nextSlide = function() {
		$scope.nextEvent();
		console.log($scope.currentevent);
	};
}]);

angular.module('scoreApp').controller('EventScoringCtrl', ['$scope', '$http', '$routeParams', '$location', '$window', '$q', 'alert', 'dropdowns', 'underscore', function($scope, $http, $routeParams, $location, $window, $q, alert, dropdowns, underscore) {
	$scope.form = {};

	$scope.focusCell = {
		row: 0,
		col: 0
	};

	$scope.dirty = false;
	
	dropdowns.getScoreCodes().then(function(data) {
		$scope.scoreCodes = data;
	});

	$scope.rankConflicts = [];

	$http({
		method: 'GET',
		url: '/tournament/' + $routeParams.tournamentID + '/info',
	}).success(function(res) {
		$scope.tournament = res;
	}).error(function(err) {
		alert.danger(err);
	});

	$http({
		method: 'GET',
		url: '/event/info',
		params: {
			tournamentID: $routeParams.tournamentID,
			name: $routeParams.eventName,
			division: $routeParams.eventDivision
		}
	}).success(function(res) {
		$scope.event = res;
	}).error(function(err) {
		alert.danger(err);
	});

	$http({
		method: 'GET',
		url: '/scoring/' + $routeParams.tournamentID + '/' + $routeParams.eventDivision + '/' + $routeParams.eventName + '/participators'
	}).success(function(res) {
		$scope.participators = res.participators;
		$scope.participators.forEach(function(participant) {
			switch(participant.scoreCode) {
				case "NS":
					participant.rawDisplay = 'ns';
					break;
				case "DQ":
					participant.rawDisplay = 'dq';
					break;
				case "P":
					participant.rawDisplay = 'p';
					break;
				default:
					participant.rawDisplay = participant.score || '';
					break;
			}
		});
		$scope.updateRankings(0);
	}).error(function(err) {
		alert.danger(err);
	});

	var compareParticipators = function(a, b) {
		// Deal with other score codes
		if(a.scoreCode !== 'participated') {
			if(b.scoreCode !== 'participated') {
				return 0;
			} else {
				return 1;
			}
		} else if(b.scoreCode !== 'participated') {
			return -1;
		}

		// Tiers first
		var tierA = isNumber(a.tier) ? Number(a.tier) : 1;
		var tierB = isNumber(b.tier) ? Number(b.tier) : 1;

		var scoreA = isNumber(a.score) ? Number(a.score) : null;
		var scoreB = isNumber(b.score) ? Number(b.score) : null;

		var tiebreakA = isNumber(a.tiebreak) ? Number(a.tiebreak) : null;
		var tiebreakB = isNumber(b.tiebreak) ? Number(b.tiebreak) : null;
		if(tierA < tierB) {
			return -1;
		} else if(tierA > tierB) {
			return 1;
		} else {	// Same tier
			if(scoreA !== null && scoreB === null) {
				return -1;
			} else if(scoreA === null && scoreB !== null) {
				return 1;
			} else if(scoreA > scoreB) {
				if($scope.event.highScoreWins) {
					return -1;
				} else {
					return 1;
				}
			} else if(scoreA < scoreB) {
				if($scope.event.highScoreWins) {
					return 1;
				} else {
					return -1;
				}
			} else {	// tie
				console.log("tiebreak!");
				if(tiebreakA !== null && tiebreakB === null) {
					return -1;
				} else if(tiebreakA === null && tiebreakB !== null) {
					return 1;
				} else if(tiebreakA > tiebreakB) {
					if($scope.event.highTiebreakWins) {
						return -1;
					} else {
						return 1;
					}
				} else if(tiebreakA < tiebreakB) {
					if($scope.event.highTiebreakWins) {
						return 1;
					} else {
						return -1;
					}
				} else {
					console.log("tie!");
					$scope.rankConflicts[a.index] = true;
					$scope.rankConflicts[b.index] = true;
					return 0;	// This is an issue, this should never be hit
				}
			}
		}
	};

	$scope.updateScoreOrder = function() {
		$scope.updateRankings(0);
		$scope.saveEvent();
	};

	$scope.saveScores = function() {
		var d = $q.defer();
		$http({
			method: 'POST',
			url: '/scoring/' + $routeParams.tournamentID + '/' + $routeParams.eventDivision + '/' + $routeParams.eventName + '/save',
			data: {
				participants: $scope.participators,
				event: $scope.event
			}
		}).success(function(res) {
			alert.success('Scoring information successfully saved');
			$scope.dirty = false;
			d.resolve();
		}).error(function(err) {
			alert.danger(err);
			d.reject();
		});
		return d.promise;
	};

	var isNumber = function(n) {
		return !isNaN(parseFloat(n)) && isFinite(n);
	};

	$scope.updateRankings = function(index) {
		$scope.dirty = true;
		if(index !== undefined && index !== null) {
			// console.log($scope.participators, "index:",index);
			if($scope.participators[index].rawDisplay) {
				switch(isNumber($scope.participators[index].rawDisplay) ? $scope.participators[index].rawDisplay : $scope.participators[index].rawDisplay.toLowerCase()) {
					case "ns":
						$scope.participators[index].scoreCode = "NS";
						$scope.participators[index].place = $scope.participators.length + 1;
						$scope.participators[index].tier = null;
						$scope.participators[index].tiebreak = null;
						break;
					case "dq":
						$scope.participators[index].scoreCode = "DQ";
						$scope.participators[index].place = $scope.participators.length + 2;
						$scope.participators[index].tier = null;
						$scope.participators[index].tiebreak = null;
						break;
					case "p":
						$scope.participators[index].scoreCode = "P";
						$scope.participators[index].place = $scope.participators.length;
						$scope.participators[index].tier = null;
						$scope.participators[index].tiebreak = null;
						break;
					default:
						if(isNumber($scope.participators[index].rawDisplay)) {
							$scope.participators[index].scoreCode = "participated";
							$scope.participators[index].score = parseFloat($scope.participators[index].rawDisplay);
						} else {
							$scope.participators[index].scoreCode = null;
							$scope.participators[index].score = null;
						}

						break;
				}
			} else {
				console.log("empty raw display");
				$scope.participators[index].scoreCode = null;
				$scope.participators[index].place = null;
			}

			var teams = $scope.participators.slice(0);
			var started = false;
			var finished = true;
			var conflicts = false;
			for(var i = $scope.participators.length - 1; i >= 0; i--) {
				teams[i].index = i;
				if(teams[i].scoreCode === null || teams[i].scoreCode === undefined) {
					finished = false;
				} else {
					started = true;
				}
			}

			$scope.rankConflicts = [];
			teams.sort(compareParticipators);
			var currentPlace = 1;

			teams.forEach(function(team, i) {
				$scope.participators[team.index].rankConflict = false;
				if(team.scoreCode === 'participated') {
					if(i > 0 && compareParticipators(team, teams[i - 1]) === 0) {
						$scope.participators[team.index].place = $scope.participators[teams[i-1].index].place;
						$scope.participators[team.index].rankConflict = true;
						$scope.participators[teams[i-1].index].rankConflict = true;
						conflicts = true;
					} else {
						$scope.participators[team.index].place = currentPlace++;
					}
				} else if(team.scoreCode === null) {
					$scope.participators[team.index].place = null;
				}
			});

			var oldStatus = $scope.event.status;
			if(!started) {
				$scope.event.status = 'Not Started';
			} else if(started && (!finished || conflicts)) {
				$scope.event.status = 'In Progress';
			} else {
				$scope.event.status = 'Completed';
			}

			if($scope.event.status !== oldStatus) {
				$scope.saveEvent();
			}
		}
	};

	$scope.saveEvent = function() {
		$http({
			method: 'POST',
			url: '/event/save',
			data: $scope.event
		}).error(function(err) {
			alert.danger(err);
		});
	};

	$window.onbeforeunload = function() {
		console.log("Leaving page");
		if($scope.dirty) {
			return "You have not saved your changes. All unsaved changes will be lost when you leave this page.";
		}
	};
}]);
angular.module('scoreApp').controller('TournamentScoringCtrl', ['$scope', '$http', '$routeParams', 'alert', function($scope, $http, $routeParams, alert) {
	$scope.division = $routeParams.division;

	var sortByEventName = function(a, b) {
		if(a.eventName < b.eventName) {
			b.
			return -1;
		} else if(a.eventName > b.eventName) {
			return 1;
		} else {
			return 0;
		}
	};

	var sum = function(acc, element) {
		return acc + Number(element.place);
	};

	var sortByTotalScore = function(a, b) {
		if(a.totalScore < b.totalScore) {
			return -1;
		} else if(a.totalScore > b.totalScore) {
			return 1;
		} else {
			var aPlaceCount = {};
			a.events.forEach(function(evt) {
				if(aPlaceCount[evt.place] == null) {
					aPlaceCount[evt.place] = 1;
				} else {
					aPlaceCount[evt.place]++;
				}
			});
			var bPlaceCount = {};
			b.events.forEach(function(evt) {
				if(bPlaceCount[evt.place] == null) {
					bPlaceCount[evt.place] = 1;
				} else {
					bPlaceCount[evt.place]++;
				}
			});

			if(aPlaceCount["1"] > bPlaceCount["1"]) {
				return -1;
			} else if(aPlaceCount["1"] < bPlaceCount["1"]) {
				return 1;
			} else {
				return 0;
			}
		}
	};

	$scope.tournament = {};

	$http({
		method: 'GET',
		url: '/tournament/' + $routeParams.tournamentID + '/info'
	}).success(function(data) {
		$scope.tournament = data;
	}).error(function(err) {
		console.log('Error getting tournament info');
	});

	$http({
		method: 'GET',
		url: '/scoring/' + $routeParams.tournamentID + '/' + $routeParams.division + '/ranks'
	}).success(function(res) {
		$scope.teams = [];
		$scope.events = [];
		res.forEach(function(entry) {
			var teamExists = false;
			$scope.teams.forEach(function(team) {
				if(team.team.number === entry.team.number) {
					teamExists = true;
					team.events.push({
						eventName: entry.event.name,
						place: entry.place
					});
				}
			});
			if(!teamExists) {
				$scope.teams.push({
					team: entry.team,
					events: [{
						eventName: entry.event.name,
						place: entry.place
					}]
				});
			}

			if(!$scope.events.some(function(evt) { return evt.eventName === entry.event.name; })) {
				$scope.events.push({
					eventName: entry.event.name,
					incomplete: (entry.place === null || entry.place === undefined) ? true : false
				});
			} else if(entry.place === null || entry.place === undefined) {
				$scope.events.forEach(function(evt) {
					if(evt.eventName === entry.event.name) {
						evt.incomplete = true;
					}
				});
			}
		});

		$scope.teams.forEach(function(team) {
			team.totalScore = team.events.reduce(sum, 0);
		});
		
		$scope.teams.sort(sortByTotalScore);

		var currentRank = 1;
		$scope.teams.forEach(function(team) {
			team.finalRank = currentRank++;
		});

	}).error(function(err) {
		alert.danger(err);
	});
}]);
angular.module('scoreApp').controller('TeamAddCtrl', ['$scope', '$routeParams', '$http', '$modalInstance', '$location', 'states', 'dropdowns', function($scope, $routeParams, $http, $modalInstance, $location, states, dropdowns) {
	$scope.cancel = function(path) {
		$modalInstance.dismiss('cancel');
		if(path){
			$location.path(path);
		}
	};
	
	dropdowns.getOfficials().then(function(data) {
		var names = [];
		data.forEach(function(entry) {
			var entryName = entry.name_first + ' ' + entry.name_last + ' (' + entry.officialID + ')';
			names.push({
				name:entryName,
				value:entry.officialID
			});
		});
		$scope.officials = names;
	});
	
	$scope.form = {};
	$scope.coaches = [];
	$scope.badCoach = false;
	$scope.form.tournamentID = $routeParams.tournamentID;
	$scope.states = states.getStates();
	
	$scope.form.state = $scope.states[0];
	$scope.divisions = ['A', 'B', 'C'];
	$scope.form.division = $scope.divisions[0];
	
	var addCoaches = function() {
		var err = false;
		var added = 0;
		$scope.coaches.forEach(function(entry) {
			$http({
				method:'POST',
				url:'/team/addcoach',
				data:{
					tournamentID:$scope.form.tournamentID,
					division:$scope.form.division,
					teamNumber:$scope.form.teamNumber,
					officialID:entry.value
				}
			}).success(function(data) {
				added = added + 1;
				console.log('Added Coach ' + entry.name);
				if(!err && added === $scope.coaches.length) {
					$scope.cancel();
				}
			}).error(function(err) {
				if(!$scope.errorMessage) {
					$scope.errorMessage = 'Team created, but could not add coach(es): ' + entry.name;
				} else {
					$scope.errorMessage = $scope.errorMessage + ', ' + entry.name;
				}
				err = true;
			});
		});
	};
	
	$scope.createTeam = function() {
		$http({
			method:'POST',
			url:'/tournament/' + $routeParams.tournamentID + '/addteam',
			data:$scope.form
		}).success(function(result) {
			console.log('Added the team');
			addCoaches();
		}).error(function(err) {
			$scope.errorMessage = err;
			console.log('Unable to add team');	
		});
	};
	
	$scope.checkCoach = function() {
		if(!$scope.form.coach) {
			console.log('No Coach');
		} else {
			console.log('Yes coach');
			var coachValid = null;
			$scope.officials.forEach(function(entry) {
				if(entry.name === $scope.form.coach) {
					coachValid = entry;
				}
			});
			if(coachValid) {
				if($scope.coaches.indexOf(coachValid) === -1) {
					$scope.coaches.push(coachValid);
					$scope.form.coach = undefined;
				}
			} else {
				$scope.errorMessage = 'This coach does not exist. Create new official? (The current team will be lost)';
				$scope.badCoach = true;
			}
		}
	};
	
	$scope.cancelCoach = function() {
		$scope.badCoach = false;
		$scope.form.coach = undefined;
		$scope.errorMessage = undefined;
	};
	
	$scope.removeCoach = function(coach) {
		var i = $scope.coaches.indexOf(coach);
		$scope.coaches.splice(i, 1);
	};
}]);
angular.module('scoreApp').controller('TeamEditCtrl', ['$scope', '$modalInstance', '$http', 'team', 'states', 'dropdowns', 'alert', function($scope, $modalInstance, $http, team, states, dropdowns, alert) {
	var indexOfID = function(a, toCheck) {
		var index = 0;
		var returnV = -1;
		a.forEach(function(entry) {
			if(entry.value === toCheck.value) {
				returnV =  index;
			} else {
				index = index + 1;
			}
		});
		return returnV;
	};
	
	dropdowns.getOfficials().then(function(data) {
		var names = [];
		data.forEach(function(entry) {
			var entryName = entry.name_first + ' ' + entry.name_last + ' (' + entry.officialID + ')';
			names.push({
				name:entryName,
				value:entry.officialID
			});
		});
		$scope.officials = names;
	});
	
	$scope.form = {};
	$scope.states = states.getStates();
	$scope.editTeam = team.get();
	$scope.coaches = []; 
	var originalCoaches = [];
	var coachesToAdd = [];
	var coachesToRemove = [];
	
	
	var queryCounter;
	var numQuery;
	var startCounting = function() {
		queryCounter = 0;
		numQuery = coachesToAdd.length + coachesToRemove.length + 1;
	};
	var signalFinished = function() {
		console.log('Success');
		queryCounter++;
		if(queryCounter === numQuery) {
			$modalInstance.dismiss('success');
			alert.success('Team successfully updated!');
		}
	};
	
	$scope.form.tournamentID = $scope.editTeam.tournamentID;
	$scope.form.teamNumber = $scope.editTeam.number;
	$scope.form.number = $scope.editTeam.number;
	$scope.form.division = $scope.editTeam.division;
	$scope.form.name = $scope.editTeam.name;
	$scope.form.state = $scope.editTeam.state;
	$scope.form.school = $scope.editTeam.school;
	
	console.log('/team/' + $scope.form.teamNumber + '/getcoaches  ' + $scope.form.tournamentID);
	
	$http({
		method:'GET',
		url:'/team/' + $scope.form.tournamentID + '/' + $scope.form.division + '/' + $scope.form.teamNumber + '/getcoaches'
	}).success(function(data) {
		console.log(' ' + data.length);
		data.forEach(function(entry) {
			var o = {
				name:entry.name_first + ' ' + entry.name_last + ' (' + entry.officialID + ')',
				value:entry.officialID
			};
			$scope.coaches.push(o);
			originalCoaches.push({
				name:entry.name_first + ' ' + entry.name_last + ' (' + entry.officialID + ')',
				value:entry.officialID
			});
		});
	}).error(function(err) {
		$scope.errorMessage = 'Error getting team coaches';
	});
	
	var addCoach = function(coach) {
		$http({
			method:'POST',
			url:'/team/addcoach',
			data:{
				tournamentID:$scope.form.tournamentID,
				division:$scope.form.division,
				teamNumber:$scope.form.teamNumber,
				officialID:coach.value
			}
		}).success(function(data) {
			coachesToAdd.splice(indexOfID(coachesToAdd, coach), 1);
			signalFinished();
		}).error(function(err) {
			if(!$scope.errorMessage) {
				$scope.errorMessage = 'Could not add ' + coach.name;
			} else {
				$scope.errorMessage = $scope.errorMessage + '\nCould not add ' + coach.name;
			}
		});
	};
	
	var removeCoach = function(coach) {
		$http({
			method:'POST',
			url:'/team/removecoach',
			data:{
				tournamentID:$scope.form.tournamentID,
				division:$scope.form.division,
				teamNumber:$scope.form.teamNumber,
				officialID:coach.value
			}
		}).success(function(data) {
			console.log('Removed Coach ' + coach.name + " " + data);
			coachesToRemove.splice(indexOfID(coachesToRemove, coach), 1);
			signalFinished();
		}).error(function(err) {
			if(!$scope.errorMessage) {
				$scope.errorMessage = 'Could not remove ' + coach.name;
			} else {
				$scope.errorMessage = $scope.errorMessage + '\nCould not remove ' + coach.name;
			}
		});
	};
	
	$scope.updateTeam = function() {
		startCounting();
		$http({
			method:'POST',
			url:'/tournament/' + $scope.editTeam.tournamentID + '/updateteam',
			data:$scope.form
		}).success(function(data) {
			$scope.editTeam.name = $scope.form.name;
			$scope.editTeam.state = $scope.form.state;
			$scope.editTeam.school = $scope.form.school;
			signalFinished();
		}).error(function(err) {
			if(!$scope.errorMessage) {
				$scope.errorMessage = "Failed to update Team";
			} else {
				$scope.errorMessage = $scope.errorMessage + "\nFailed to update Team";
			}
		});
		coachesToAdd.forEach(function(entry) {
			addCoach(entry);
		});
		coachesToRemove.forEach(function(entry) {
			removeCoach(entry);
		});
	};
	
	$scope.cancel = function(path) {
		$modalInstance.dismiss('cancel');
		if(path){
			$location.path(path);
		}
	};
	
	$scope.checkCoach = function() {
		if(!$scope.form.coach) {
			console.log('No Coach');
		} else {
			console.log('Yes coach');
			var coachValid = null;
			$scope.officials.forEach(function(entry) {
				if(entry.name === $scope.form.coach) {
					coachValid = entry;
				}
			});
			if(coachValid) {
				if(indexOfID($scope.coaches, coachValid) === -1) {
					$scope.coaches.push(coachValid);
					if(indexOfID(originalCoaches, coachValid, true) === -1) {
						coachesToAdd.push(coachValid);
					}
					var removeIndex = indexOfID(coachesToRemove, coachValid);
					if(removeIndex !== -1) {
						coachesToRemove.splice(removeIndex, 1);
					}
					$scope.form.coach = undefined;
				}
			} else {
				$scope.errorMessage = 'This coach does not exist. Create new official? (The current team will not be updated)';
				$scope.badCoach = true;
			}
		}
	};
	
	$scope.cancelCoach = function() {
		$scope.badCoach = false;
		$scope.form.coach = undefined;
		$scope.errorMessage = undefined;
	};
	
	$scope.removeCoach = function(coach) {
		var displayIndex = indexOfID($scope.coaches, coach);
		var toAddIndex = indexOfID(coachesToAdd, coach);
		$scope.coaches.splice(displayIndex, 1);
		if(toAddIndex === -1) {
			coachesToRemove.push(coach);
		} else {
			coachesToAdd.splice(toAddIndex, 1);
		}
	};
}]);
angular.module('scoreApp').controller('TeamListingCtrl', ['$scope', '$window', '$http', '$routeParams', '$modal', 'tournament', 'alert', 'team', function($scope, $window, $http, $routeParams, $modal, tournament, alert, team) {	
	$http({
		method:'GET',
		url:'/tournament/' + $routeParams.tournamentID + '/teams',
		cache:true
	}).success(function(data) {
		$scope.teams = data;
	}).error(function(err) {
		console.log('Error getting teams');
	});

	$scope.addTeam = function() {
		$modal.open({
			templateUrl:'/partials/team/newteam.html',
			controller:'TeamAddCtrl'
		});
	};
	
	$scope.removeTeam = function(t) {
		if($window.confirm('Are you sure you want to remove ' + t.name + '?')) {
			$http({
				method:'POST',
				url:'/tournament/' + $routeParams.tournamentID + '/removeteam',
				data:t
			}).success(function(data) {
				var i = $scope.teams.indexOf(t);
				$scope.teams.splice(i, 1);
				alert.success('Removed team ' + t.name + ' from tournament');
			}).error(function(err) {
				alert.danger('There was an error. Could not remove ' + t.name + '!');
			});
		}
	};
	
	$scope.editTeamWindow = function(t) {
		team.set(t);
		$modal.open({
			templateUrl:'/partials/team/editteam.html',
			controller:'TeamEditCtrl'
		});
	};
	
	$scope.switchExpanded = function(t) {
		if($scope.expanded) {
			if($scope.expanded === t) {
				t.show = false;
				$scope.expanded = undefined;
			} else {
				$scope.expanded.show = false;
				$scope.expanded = t;
				t.show = true;
			}
		} else {
			$scope.expanded = t;
			t.show = true;
		}
	};
}]);
angular.module('scoreApp').controller('TournamentAddEventCtrl', ['$window', '$scope', '$http', '$modalInstance', 'dropdowns', 'tournament', 'alert', function($window, $scope, $http, $modalInstance, dropdowns, tournament, alert) {
	$scope.cancel = function() {
		$modalInstance.dismiss('cancel');
	};

	$scope.createForm = {
		active: false
	};

	$scope.divisions = ['A', 'B', 'C'];
	$scope.tournament = tournament.get();

	$scope.form = {};
	$scope.form.tournamentID = $scope.tournament.id;
	dropdowns.getTournamentEvents().then(function(data) {
		eventNames = [];
		data.forEach(function(entry) {
			var entryName = entry.eventName + ' (Div: ' + entry.division + ')';
			eventNames.push({
				name:entryName,
				value:entry
			});
		});
		$scope.events = eventNames;
		$scope.form.eventToAdd = eventNames[0].value;
	});
	
	dropdowns.getOfficials().then(function(data) {
		var names = [];
		data.forEach(function(entry) {
			var entryName = entry.name_first + ' ' + entry.name_last + ' (' + entry.officialID + ')';
			names.push({
				name:entryName,
				value:entry.officialID
			});
		});
		$scope.officials = names;
	});

	$scope.eventTypes = [
		{value:'Standard'},
		{value:'Trial'}
	];
	$scope.form.eventType = $scope.eventTypes[0];
	
	$scope.form.highTiebreakWins = '1';
	$scope.form.highScoreWins = '1';
	
	$scope.form.highScoreWinsHighTrigger = true;
	$scope.form.highScoreWinsLowTrigger = false;
	$scope.form.highTiebreakWinsHighTrigger = true;
	$scope.form.highTiebreakWinsLowTrigger = false;

	$scope.updateCheckboxes = function() {
		if($scope.form.highScoreWins === '1' && (!$scope.form.highScoreWinsHighTrigger || $scope.form.highScoreWinsLowTrigger)) {
			$scope.form.highScoreWins = '0';
			$scope.form.highScoreWinsHighTrigger = false;
			$scope.form.highScoreWinsLowTrigger = true;
		} else if($scope.form.highScoreWins === '0' && ($scope.form.highScoreWinsHighTrigger || !$scope.form.highScoreWinsLowTrigger)) {
			$scope.form.highScoreWins = '1';
			$scope.form.highScoreWinsHighTrigger = true;
			$scope.form.highScoreWinsLowTrigger = false;
		}

		if($scope.form.highTiebreakWins === '1' && (!$scope.form.highTiebreakWinsHighTrigger || $scope.form.highTiebreakWinsLowTrigger)) {
			$scope.form.highTiebreakWins = '0';
			$scope.form.highTiebreakWinsHighTrigger = false;
			$scope.form.highTiebreakWinsLowTrigger = true;
		} else if($scope.form.highTiebreakWins === '0' && ($scope.form.highTiebreakWinsHighTrigger || !$scope.form.highTiebreakWinsLowTrigger)) {
			$scope.form.highTiebreakWins = '1';
			$scope.form.highTiebreakWinsHighTrigger = true;
			$scope.form.highTiebreakWinsLowTrigger = false;
		}
	};

	$scope.addEvent = function() {
		$scope.officials.forEach(function(entry) {
			if(entry.name === $scope.supervisorName) {
				$scope.form.supervisorID = entry.value;
			}
			if(entry.name === $scope.writerName) {
				$scope.form.writerID = entry.value;
			}
		});

		if($scope.createForm.active) {
			console.log("Creating new event");
			$http({
				method: 'POST',
				url: '/event/create',
				data: $scope.createForm
			}).success(function (res) {
				$scope.form.eventToAdd.division = $scope.createForm.division;
				$scope.form.eventToAdd.eventName = $scope.createForm.name;
				$scope.submitAddEventForm();
			}).error(function (err) {
				alert.danger(err);
			});
		} else {
			$scope.submitAddEventForm();
		}
	};

	$scope.submitAddEventForm = function() {
		console.log($scope.form);
		$http({
			method:'POST',
			url:'/tournament/addevent',
			data: $scope.form
		}).success(function (event) {
			alert.success('Successfully added event to tournament');
			$modalInstance.close(event);
		}).error(function (err) {
			alert.danger(err);
		});
	};
}]);
angular.module('scoreApp').controller('TournamentCreateCtrl', ['$scope', '$http', '$modalInstance', 'dropdowns', 'alert', 'organizationID', function($scope, $http, $modalInstance, dropdowns, alert, organizationID) {
	$scope.form = {};
	$scope.form.organizationID = organizationID;

	dropdowns.getTournamentLevels().then(function(data) {
		$scope.types = data;
		$scope.form.type = data[0];
	});

	$scope.createTournament = function() {
		$http({
			method: 'POST',
			url: '/tournament/create',
			data: $scope.form
		}).success(function(tournament) {
			$modalInstance.close(tournament);
			alert.success('Successfully created tournament');
		}).error(function(err) {
			alert.danger(err);
		});
	};

	$scope.close = function() {
		$modalInstance.dismiss('cancel');
	};
}]);
angular.module('scoreApp').controller('TournamentDashCtrl', ['$scope', '$rootScope', '$window', 'dropdowns', '$http', '$routeParams', '$filter', '$modal', 'tournament', 'alert', function($scope, $rootScope, $window, dropdowns, $http, $routeParams, $filter, $modal, tournament, alert) {
	$scope.form = {};
	// Get the tournament information
	$http({
		method:'GET',
		url:'/tournament/' + $routeParams.tournamentID + '/info'
	}).success(function(data) {
		$scope.tournament = data;
		tournament.set($scope.tournament);
		$scope.tournamentDate = new Date(data.date);
	}).error(function(err) {
		console.log('Error getting tournament info');
	});
	
	$http({
		method:'GET',
		url:'/organization/' + $routeParams.tournamentID + '/getorganizers'
	}).success(function(data) {
		$scope.organizers = data;
	}).error(function(err) {
		console.log('Error getting organizers');
	});
	
	$http({
		method:'GET',
		url:'/tournament/' + $routeParams.tournamentID + '/events'
	}).success(function(events) {
		$scope.eventStatuses = [{
			level:'Completed',
			events:$filter('status')(events, 'Completed')
		}, {
			level:'InProgress',
			events:$filter('status')(events, 'In Progress')
		}, {
			level:'NotStarted',
			events:$filter('status')(events, 'Not Started')
		}];
		$scope.total = $scope.eventStatuses[0].events.length + $scope.eventStatuses[1].events.length + $scope.eventStatuses[2].events.length;
		console.log('events ' + $scope.eventStatuses[0].events.length);
	}).error(function(err) {
		console.log('Error getting events');
	});
	
	$scope.editTournament = function() {
		tournament.set($scope.tournament);
		$modal.open({
			templateUrl:'/partials/tournament/edittournament.html',
			controller:'TournamentEditCtrl'
		});
	};

	$scope.exportData = function() {
		$window.open('/exportData/' + $routeParams.tournamentID + '/getData');
	};

	$scope.loadPresentation = function() {
		$window.open('/tournament/' + $routeParams.tournamentID + '/presentation', 'newwindow', config='left=200, top=100, height=500, width=800, toolbar=no, menubar=no, location=no, directories=no, status=no');
	};
}]);
angular.module('scoreApp').controller('TournamentEditCtrl', ['$scope', '$http', '$modalInstance', 'tournament', 'dropdowns', function($scope, $http, $modalInstance, tournament, dropdowns) {
	$scope.form = {};
	dropdowns.getTournamentLevels().then(function(data) {
		$scope.types = data;
	});
	$scope.editTournament = tournament.get();
	
	$scope.form.name = $scope.editTournament.name;
	$scope.form.date = $scope.editTournament.date;
	$scope.form.location = $scope.editTournament.location;
	$scope.form.type = $scope.editTournament.type;
	$scope.form.id = $scope.editTournament.id;
	$scope.form.eventMedalCount = $scope.editTournament.eventMedalCount;
	$scope.form.overallTrophyCount = $scope.editTournament.overallTrophyCount;
	$scope.form.oneTrophyPerSchool = $scope.editTournament.oneTrophyPerSchool;

	$scope.updateTournament = function() {
		$http({
			method:'POST',
			url:'/tournament/update',
			data:$scope.form
		}).success(function(data) {
			$scope.editTournament.name = $scope.form.name;
			$scope.editTournament.date = $scope.form.date;
			$scope.editTournament.location = $scope.form.location;
			$scope.editTournament.type = $scope.form.type;
			$scope.editTournament.id = $scope.form.id;
			$scope.editTournament.eventMedalCount = $scope.form.eventMedalCount;
			$scope.editTournament.overallTrophyCount = $scope.form.overallTrophyCount;
			$scope.editTournament.oneTrophyPerSchool = $scope.form.oneTrophyPerSchool;
			$modalInstance.dismiss('success');
		}).error(function(err) {
			console.log('Error editing tournament');
		});
	};
	
	$scope.cancel = function() {
		$modalInstance.dismiss('cancel');
	};
}]);
angular.module('scoreApp').directive('advanceSlide', [function() {
	return {
		restrict: 'A',
		scope: {
			reveal: '&',
			nextSlide: '&',
			index: '=',
			maxIndex: '=',
			disabled: '='
		},
		link: function(scope, elem, attrs) {
			elem.bind("keyup", function(evt) {
				console.log("key pressed", evt.which);
				if([39,40,13].indexOf(evt.which) !== -1) {	// right arrow (39), down arrow (40), enter (13)
					console.log("right key pressed");
					if(!scope.disabled) {
						scope.$apply(function() {
							console.log("index:",scope.index,"maxindex:",parseInt(scope.maxIndex, 10));
							if(scope.index < parseInt(scope.maxIndex, 10)) {
								console.log("about to reveal");
								scope.reveal(scope.index);
								scope.index++;
							} else {
								scope.nextSlide();
								scope.index = 0;
							}
						});
					}
				}
			});
		}
	};
}]);
angular.module('scoreApp').directive('animationShowHide', function() {
	return function(scope, element, attrs) {
		if(attrs.animationShowHide) {
			element.removeClass('no-display');
		} else {
			element.addClass('no-display');
		}

		scope.$watch(attrs.animationShowHide, function(newVal, oldVal) {
			if(newVal) {
				element.removeClass(attrs.hideAnimation);
				element.addClass(attrs.showAnimation);
				element.removeClass('no-display');
			} else {
				element.removeClass(attrs.showAnimation);
				element.addClass(attrs.hideAnimation);
			}
		});

		element.on('animationend webkitAnimationEnd onanimationend MSAnimationEnd', function() {
			if(element.hasClass(attrs.hideAnimation)) {
				element.addClass('no-display');
			}
		});
	};
});
angular.module('scoreApp').directive('autosizeText', ['$window', function($window) {
	var resize = function(elem) {
		// console.log("elem:",elem.height(),", parent:", elem.parent().height());
		elem.css('font-size', elem.parent().height() + 'px');
		var iterations = 0;
		while((elem.height() < elem.parent().height() - 1 || elem.height() > elem.parent().height() + 1) && iterations < 100) {
			if(elem.height() < elem.parent().height() - 1) {
				elem.css('font-size', (parseInt(elem.css('font-size').slice(0, -2), 10) + 1) + 'px');
			} else {
				elem.css('font-size', (parseInt(elem.css('font-size').slice(0, -2), 10) - 1) + 'px');
			}
			iterations += 1;
			// console.log("elem:",elem.height(),", parent:", elem.parent().height(), "font-size:", (parseInt(elem.css('font-size').slice(0, -2), 10) + 1));
		}

		console.log("iterations", iterations);
	};

	return function(scope, elem, attrs) {
		var tryResize = function(elem, tries) {
			if(elem.text().length > 0) {
				resize(elem);
			} else if(tries < 3) {
				setTimeout(function() {
					tryResize(elem, tries + 1);
				}, 1000);
			}
		};

		tryResize(elem, 0);

		angular.element($window).bind('resize', function() {
			tryResize(elem, 0);
		});
	};
}]);
angular.module('scoreApp').directive('cellNavigation', ['$timeout', function($timeout) {
	return {
		restrict: 'A',
		scope: {
			row: '=',
			col: '=',
			rowCount: '=',
			colCount: '=',
			focusCell: '='
		},
		link: function(scope, elem, attrs) {
			scope.$watch('focusCell', function(newVal) {
				if(newVal.row === scope.row && newVal.col === Number(scope.col)) {
					$timeout(function() {
						elem[0].focus();
					});
				}
			}, true);

			elem.bind("keydown", function(evt) {
				if([40,13].indexOf(evt.which) !== -1) {	// down arrow (40) or enter (13)
					if(scope.row >= scope.rowCount - 1) {
						if(Number(scope.col) >= Number(scope.colCount) - 1) {
							scope.$apply(function() {
								scope.focusCell.row = 0;
								scope.focusCell.col = 0;
							});
						} else {
							scope.$apply(function() {
								scope.focusCell.row = 0;
								scope.focusCell.col = Number(scope.col) + 1;
							});
						}
					} else {
						scope.$apply(function() {
							scope.focusCell.row = scope.row + 1;
							scope.focusCell.col = Number(scope.col);
						});
					}
				} else if(evt.which === 38) {	// up arrow (38)
					if(scope.row <= 0) {
						if(Number(scope.col) <= 0) {
							scope.$apply(function() {
								scope.focusCell.row = scope.rowCount - 1;
								scope.focusCell.col = Number(scope.colCount) - 1;
							});
						} else {
							scope.$apply(function() {
								scope.focusCell.row = scope.rowCount - 1;
								scope.focusCell.col = Number(scope.col) - 1;
							});
						}
					} else {
						scope.$apply(function() {
							scope.focusCell.row = scope.row - 1;
							scope.focusCell.col = Number(scope.col);
						});
					}
				}
			});
		}
	};
}]);
angular.module('scoreApp').filter('division', [function() {
	return function(inputs, value) {
		var result = [];
		if(inputs === undefined) {
			return inputs;
		} else {
			inputs.forEach(function(entry) {
				if(entry.division === value) {
					result.push(entry);
				}
			});
			console.log(result);
			return result;
		}
	};
}]);
angular.module('scoreApp').filter('status', [function() {
	return function(inputs, value) {
		var result = [];
		if(inputs === undefined) {
			return inputs;
		} else {
			inputs.forEach(function(entry) {
				if(entry.status === value) {
					result.push(entry);
				}
			});
			return result;
		}
	};
}]);
angular.module('scoreApp').service('alert', ['$rootScope', '$timeout', function($rootScope, $timeout) {
	var createMessage = function(type, text, timeout) {
		$rootScope.message = {
			type: type,
			text: text,
			show: true
		};

		$timeout(function() {
			$rootScope.message.show = false;
		}, timeout || 5000);
	};

	return {
		success: function(message, timeout) {
			createMessage('alert-success', message, timeout);
		},
		info: function(message, timeout) {
			createMessage('alert-info', message, timeout);
		},
		warning: function(message, timeout) {
			createMessage('alert-info', message, timeout);
		},
		danger: function(message, timeout) {
			createMessage('alert-danger', message, timeout);
		}
	};
}]);
angular.module('scoreApp').factory('api', ['$q', '$http', 'user', function($q, $http, user) {

    return {

		login: function(formData) {
			var d = $q.defer();
			$http({
				method: 'POST',
				url: '/account/login/',
				data: formData
			}).success(function(res) {
				if (res.status) {
					d.resolve('Successfully logged in');
				} else {
					d.reject('Invalid login!');
				}
			}).error(function(err) {
				d.reject(err);
			});

			return d.promise;
		},

		logout: function() {
			var d = $q.defer();
			$http({
				method: 'POST',
				url: '/account/logout'
			}).success(function(res) {
				if (res.status) {
					d.resolve('Successfully logged out');
				} else {
					d.reject('Logout not successful');
				}
			}).error(function(err) {
				d.reject(err);
			});

			return d.promise;
		},

		createAccount: function(formData) {
			var d = $q.defer();
			$http({
				method: 'POST',
				url: '/account/create',
				data: formData
			}).success(function(res) {
				if (res.status) {
					user.current(); // Update current user.
					d.resolve('Successfully created account!');
				} else {
					d.reject('Account creation not successful!');
				}
			}).error(function(err) {
				d.reject(err);
			});

			return d.promise;
		},

		updatePassword: function(formData) {
			var d = $q.defer();
			$http({
				method: 'POST',
				url: '/account/updatePassword',
				data: formData
			}).success(function(res) {
				if (res.status) {
					d.resolve('Successfully updated password!');
				} else {
					d.reject('Password update not successful!');
				}
			}).error(function(err) {
				d.reject(err);
			});

			return d.promise;
		},

		updateEmail: function(formData) {
			var d = $q.defer();
			$http({
				method: 'POST',
				url: '/account/updateEmail',
				data: formData
			}).success(function(res) {
				if (res.status) {
					d.resolve('Successfully updated email!');
				} else {
					d.reject('Email update not successful');
				}
			}).error(function(err) {
				d.reject(err);
			});
		},

		getUserOrganizations: function(user) {
			var d = $q.defer();
			if (user.username) {
				$http({
					method: 'GET',
					url: '/account/' + user.username + '/organizations'
				}).success(function(organizations) {
					d.resolve(organizations);
				}).error(function(err) {
					console.log('Error getting user organizations')
					d.reject(err);
				});
			} else {
				d.resolve([]);
			}

			return d.promise;
		},

        getEvents: function(tournamentID) {
            var d = $q.defer();
            $http({
                method: 'GET',
                url: '/tournament/' + tournamentID + '/events'
            }).success(function(events) {
                d.resolve(events);
            }).error(function(err) {
                console.log('Error getting tournament events');
                d.reject(err);
            });

            return d.promise;
        },

        getEventScores: function(tournamentID, division, eventName) {
            var d = $q.defer();
            $http({
                method: 'GET',
                url: '/scoring/' + tournamentID + '/' + division + '/' + eventName + '/participators'
            }).success(function(scores) {
                d.resolve(scores);
            }).error(function(err) {
                console.log('Error fetching event scores');
                d.reject(err);
            });

            return d.promise;
        },

        getOverallTeamRankings: function(tournamentID, division) {
            var d = $q.defer();
            $http({
                method: 'GET',
                url: '/scoring/' + tournamentID + '/' + division + '/ranks'
            }).success(function(rankings) {
                d.resolve(rankings);
            }).error(function(err) {
                console.log('Error fetching team rankings');
                d.reject(err);
            });

            return d.promise;
        },

        getTournamentInfo: function(tournamentID) {
            var d = $q.defer();
            $http({
                method: 'GET',
                url: '/tournament/' + tournamentID + '/info'
            }).success(function(tournament) {
                d.resolve(tournament);
            }).error(function(err) {
                console.log('Error getting tournament info');
                d.reject(err);
            });

            return d.promise;
        }

    };

}]);

angular.module('scoreApp').factory('authInterceptor', ['$rootScope', '$location', '$q', 'alert', 'userCache', function($rootScope, $location, $q, alert, userCache) {
	return function(promise) {
		return promise.then(
			function(response) {	// Success
				return response;
			}, function(response) {	// Error
				if(response.status === 401) {
					alert.danger('You do not have access to this page');
					if(!userCache.get().username) {
						if($location.path() !== '/login') {
							$location.search('redirect', $location.path());
							$location.path('/login');
						}
					} else {
						$location.path('/401');
					}
					return $q.reject(response);
				} else {
					return $q.reject(response);
				}
			}
		);
	};
}]);

angular.module('scoreApp').service('dropdowns', ['$q', '$http', function($q, $http) {
	return {
		getTournamentLevels: function() {
			var d = $q.defer();
			$http({
				method: 'GET',
				url: '/tournament/levels',
				cache: true
			}).success(function(data) {
				d.resolve(data);
			}).error(function(err) {
				d.reject(err);
			});
			return d.promise;
		},
		getTournamentEvents: function() {
			var deferred = $q.defer();
			$http({
				method: 'GET',
				url: '/event/all',
				cache: true
			}).success(function(data) {
				deferred.resolve(data);
			}).error(function(err) {
				deferred.reject(err);
			});
			return deferred.promise;
		},
		getOfficials: function() {
			var deferred = $q.defer();
			$http({
				method:'GET',
				url:'/official/all',
				cache:true
			}).success(function(data) {
				deferred.resolve(data);
			}).error(function(err) {
				deferred.reject(err);
			});
			return deferred.promise;
		},
		getScoreCodes: function() {
			var d = $q.defer();
			$http({
				method: 'GET',
				url: '/scoring/scoreCodes',
				cache: true
			}).success(function(data) {
				d.resolve(data);
			}).error(function(err) {
				d.reject(err);
			});
			return d.promise;
		},
		getEventStatuses: function() {
			var d = $q.defer();
			$http({
				method: 'GET',
				url: '/event/statuses',
				cache: true
			}).success(function(statuses) {
				d.resolve(statuses);
			}).error(function(err) {
				d.reject(err);
			});
			return d.promise;
		}
	};
}]);

angular.module('scoreApp').service('official', [function() {
	var official = {};
	
	return{
		set: function(officialData) {
			official = officialData;
		},
		get: function() {
			return official;
		}
	};
}]);
angular.module('scoreApp').service('states', [function() {
	var states = ['AL','AK','AZ','AR','CA','CO','CT','DC','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME',
					'MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI',
					'SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'];
					
	return {
		getStates:function() {
			return states;
		}	
	};
}]);
angular.module('scoreApp').service('team', [function() {
	var team = {};
	
	return{
		set: function(teamData) {
			team = teamData;
		},
		get: function() {
			return team;
		}
	};
}]);
angular.module('scoreApp').service('tournament', [function() {
	var tournament = {};

	return {
		set: function(tournamentData) {
			tournament = tournamentData;
		},
		get: function() {
			return tournament;
		}
	};
}]);
angular.module('scoreApp').service('underscore', [function() {
	return {
		throttle: function(func, wait, options) {
			console.log('throttling');
			var context, args, result;
			var timeout = null;
			var previous = 0;
			options || (options = {});
			var later = function() {
				previous = options.leading === false ? 0 : new Date;
				timeout = null;
				result = func.apply(context, args);
			};
			return function() {
				var now = new Date;
				if (!previous && options.leading === false) previous = now;
				var remaining = wait - (now - previous);
				context = this;
				args = arguments;
				if (remaining <= 0) {
					clearTimeout(timeout);
					timeout = null;
					previous = now;
					result = func.apply(context, args);
				} else if (!timeout && options.trailing !== false) {
					timeout = setTimeout(later, remaining);
				}
				return result;
			};
		},
		debounce: function(func, wait, immediate) {
			var timeout, args, context, timestamp, result;
			return function() {
				context = this;
				args = arguments;
				timestamp = new Date();
				var later = function() {
					var last = (new Date()) - timestamp;
					if (last < wait) {
						timeout = setTimeout(later, wait - last);
					} else {
						timeout = null;
						if (!immediate) result = func.apply(context, args);
					}
				};
				var callNow = immediate && !timeout;
				if (!timeout) {
					timeout = setTimeout(later, wait);
				}
				if (callNow) result = func.apply(context, args);
				return result;
			};
		}
	};
}]);
angular.module('scoreApp').service('user', ['$rootScope', '$http', '$q', function($rootScope, $http, $q) {
	return {
		current: function() {
			var d = $q.defer();
			$http({
				method: 'GET',
				url: '/account/current',
				cache: false
			}).success(function(user) {
				$rootScope.$emit('fetchUser', user);
				d.resolve(user);
			}).error(function(err) {
				d.reject(err);
			});
			
			return d.promise;
		}
	};
}]);
angular.module('scoreApp').service('userCache', ['$rootScope', function($rootScope) {
	var cachedUser = {};

	$rootScope.$on('fetchUser', function(event, user) {
		cachedUser = user;
	});

	return {
		get: function() {
			return cachedUser;
		}
	};
}]);
(function(m,f,l){'use strict';f.module("ngCookies",["ng"]).factory("$cookies",["$rootScope","$browser",function(d,b){var c={},g={},h,i=!1,j=f.copy,k=f.isUndefined;b.addPollFn(function(){var a=b.cookies();h!=a&&(h=a,j(a,g),j(a,c),i&&d.$apply())})();i=!0;d.$watch(function(){var a,e,d;for(a in g)k(c[a])&&b.cookies(a,l);for(a in c)e=c[a],f.isString(e)?e!==g[a]&&(b.cookies(a,e),d=!0):f.isDefined(g[a])?c[a]=g[a]:delete c[a];if(d)for(a in e=b.cookies(),c)c[a]!==e[a]&&(k(e[a])?delete c[a]:c[a]=e[a])});return c}]).factory("$cookieStore",
["$cookies",function(d){return{get:function(b){return(b=d[b])?f.fromJson(b):b},put:function(b,c){d[b]=f.toJson(c)},remove:function(b){delete d[b]}}}])})(window,window.angular);
angular.module("ui.bootstrap", ["ui.bootstrap.tpls", "ui.bootstrap.transition","ui.bootstrap.collapse","ui.bootstrap.accordion","ui.bootstrap.alert","ui.bootstrap.bindHtml","ui.bootstrap.buttons","ui.bootstrap.carousel","ui.bootstrap.position","ui.bootstrap.datepicker","ui.bootstrap.dropdownToggle","ui.bootstrap.modal","ui.bootstrap.pagination","ui.bootstrap.tooltip","ui.bootstrap.popover","ui.bootstrap.progressbar","ui.bootstrap.rating","ui.bootstrap.tabs","ui.bootstrap.timepicker","ui.bootstrap.typeahead"]);
angular.module("ui.bootstrap.tpls", ["template/accordion/accordion-group.html","template/accordion/accordion.html","template/alert/alert.html","template/carousel/carousel.html","template/carousel/slide.html","template/datepicker/datepicker.html","template/datepicker/popup.html","template/modal/backdrop.html","template/modal/window.html","template/pagination/pager.html","template/pagination/pagination.html","template/tooltip/tooltip-html-unsafe-popup.html","template/tooltip/tooltip-popup.html","template/popover/popover.html","template/progressbar/bar.html","template/progressbar/progress.html","template/rating/rating.html","template/tabs/tab.html","template/tabs/tabset-titles.html","template/tabs/tabset.html","template/timepicker/timepicker.html","template/typeahead/typeahead-match.html","template/typeahead/typeahead-popup.html"]);
angular.module('ui.bootstrap.transition', [])

/**
 * $transition service provides a consistent interface to trigger CSS 3 transitions and to be informed when they complete.
 * @param  {DOMElement} element  The DOMElement that will be animated.
 * @param  {string|object|function} trigger  The thing that will cause the transition to start:
 *   - As a string, it represents the css class to be added to the element.
 *   - As an object, it represents a hash of style attributes to be applied to the element.
 *   - As a function, it represents a function to be called that will cause the transition to occur.
 * @return {Promise}  A promise that is resolved when the transition finishes.
 */
.factory('$transition', ['$q', '$timeout', '$rootScope', function($q, $timeout, $rootScope) {

  var $transition = function(element, trigger, options) {
    options = options || {};
    var deferred = $q.defer();
    var endEventName = $transition[options.animation ? "animationEndEventName" : "transitionEndEventName"];

    var transitionEndHandler = function(event) {
      $rootScope.$apply(function() {
        element.unbind(endEventName, transitionEndHandler);
        deferred.resolve(element);
      });
    };

    if (endEventName) {
      element.bind(endEventName, transitionEndHandler);
    }

    // Wrap in a timeout to allow the browser time to update the DOM before the transition is to occur
    $timeout(function() {
      if ( angular.isString(trigger) ) {
        element.addClass(trigger);
      } else if ( angular.isFunction(trigger) ) {
        trigger(element);
      } else if ( angular.isObject(trigger) ) {
        element.css(trigger);
      }
      //If browser does not support transitions, instantly resolve
      if ( !endEventName ) {
        deferred.resolve(element);
      }
    });

    // Add our custom cancel function to the promise that is returned
    // We can call this if we are about to run a new transition, which we know will prevent this transition from ending,
    // i.e. it will therefore never raise a transitionEnd event for that transition
    deferred.promise.cancel = function() {
      if ( endEventName ) {
        element.unbind(endEventName, transitionEndHandler);
      }
      deferred.reject('Transition cancelled');
    };

    return deferred.promise;
  };

  // Work out the name of the transitionEnd event
  var transElement = document.createElement('trans');
  var transitionEndEventNames = {
    'WebkitTransition': 'webkitTransitionEnd',
    'MozTransition': 'transitionend',
    'OTransition': 'oTransitionEnd',
    'transition': 'transitionend'
  };
  var animationEndEventNames = {
    'WebkitTransition': 'webkitAnimationEnd',
    'MozTransition': 'animationend',
    'OTransition': 'oAnimationEnd',
    'transition': 'animationend'
  };
  function findEndEventName(endEventNames) {
    for (var name in endEventNames){
      if (transElement.style[name] !== undefined) {
        return endEventNames[name];
      }
    }
  }
  $transition.transitionEndEventName = findEndEventName(transitionEndEventNames);
  $transition.animationEndEventName = findEndEventName(animationEndEventNames);
  return $transition;
}]);

angular.module('ui.bootstrap.collapse',['ui.bootstrap.transition'])

// The collapsible directive indicates a block of html that will expand and collapse
.directive('collapse', ['$transition', function($transition) {
  // CSS transitions don't work with height: auto, so we have to manually change the height to a
  // specific value and then once the animation completes, we can reset the height to auto.
  // Unfortunately if you do this while the CSS transitions are specified (i.e. in the CSS class
  // "collapse") then you trigger a change to height 0 in between.
  // The fix is to remove the "collapse" CSS class while changing the height back to auto - phew!
  var fixUpHeight = function(scope, element, height) {
    // We remove the collapse CSS class to prevent a transition when we change to height: auto
    element.removeClass('collapse');
    element.css({ height: height });
    // It appears that  reading offsetWidth makes the browser realise that we have changed the
    // height already :-/
    var x = element[0].offsetWidth;
    element.addClass('collapse');
  };

  return {
    link: function(scope, element, attrs) {

      var isCollapsed;
      var initialAnimSkip = true;
      scope.$watch(function (){ return element[0].scrollHeight; }, function (value) {
        //The listener is called when scollHeight changes
        //It actually does on 2 scenarios: 
        // 1. Parent is set to display none
        // 2. angular bindings inside are resolved
        //When we have a change of scrollHeight we are setting again the correct height if the group is opened
        if (element[0].scrollHeight !== 0) {
          if (!isCollapsed) {
            if (initialAnimSkip) {
              fixUpHeight(scope, element, element[0].scrollHeight + 'px');
            } else {
              fixUpHeight(scope, element, 'auto');
            }
          }
        }
      });
      
      scope.$watch(attrs.collapse, function(value) {
        if (value) {
          collapse();
        } else {
          expand();
        }
      });
      

      var currentTransition;
      var doTransition = function(change) {
        if ( currentTransition ) {
          currentTransition.cancel();
        }
        currentTransition = $transition(element,change);
        currentTransition.then(
          function() { currentTransition = undefined; },
          function() { currentTransition = undefined; }
        );
        return currentTransition;
      };

      var expand = function() {
        if (initialAnimSkip) {
          initialAnimSkip = false;
          if ( !isCollapsed ) {
            fixUpHeight(scope, element, 'auto');
          }
        } else {
          doTransition({ height : element[0].scrollHeight + 'px' })
          .then(function() {
            // This check ensures that we don't accidentally update the height if the user has closed
            // the group while the animation was still running
            if ( !isCollapsed ) {
              fixUpHeight(scope, element, 'auto');
            }
          });
        }
        isCollapsed = false;
      };
      
      var collapse = function() {
        isCollapsed = true;
        if (initialAnimSkip) {
          initialAnimSkip = false;
          fixUpHeight(scope, element, 0);
        } else {
          fixUpHeight(scope, element, element[0].scrollHeight + 'px');
          doTransition({'height':'0'});
        }
      };
    }
  };
}]);

angular.module('ui.bootstrap.accordion', ['ui.bootstrap.collapse'])

.constant('accordionConfig', {
  closeOthers: true
})

.controller('AccordionController', ['$scope', '$attrs', 'accordionConfig', function ($scope, $attrs, accordionConfig) {
  
  // This array keeps track of the accordion groups
  this.groups = [];

  // Ensure that all the groups in this accordion are closed, unless close-others explicitly says not to
  this.closeOthers = function(openGroup) {
    var closeOthers = angular.isDefined($attrs.closeOthers) ? $scope.$eval($attrs.closeOthers) : accordionConfig.closeOthers;
    if ( closeOthers ) {
      angular.forEach(this.groups, function (group) {
        if ( group !== openGroup ) {
          group.isOpen = false;
        }
      });
    }
  };
  
  // This is called from the accordion-group directive to add itself to the accordion
  this.addGroup = function(groupScope) {
    var that = this;
    this.groups.push(groupScope);

    groupScope.$on('$destroy', function (event) {
      that.removeGroup(groupScope);
    });
  };

  // This is called from the accordion-group directive when to remove itself
  this.removeGroup = function(group) {
    var index = this.groups.indexOf(group);
    if ( index !== -1 ) {
      this.groups.splice(this.groups.indexOf(group), 1);
    }
  };

}])

// The accordion directive simply sets up the directive controller
// and adds an accordion CSS class to itself element.
.directive('accordion', function () {
  return {
    restrict:'EA',
    controller:'AccordionController',
    transclude: true,
    replace: false,
    templateUrl: 'template/accordion/accordion.html'
  };
})

// The accordion-group directive indicates a block of html that will expand and collapse in an accordion
.directive('accordionGroup', ['$parse', '$transition', '$timeout', function($parse, $transition, $timeout) {
  return {
    require:'^accordion',         // We need this directive to be inside an accordion
    restrict:'EA',
    transclude:true,              // It transcludes the contents of the directive into the template
    replace: true,                // The element containing the directive will be replaced with the template
    templateUrl:'template/accordion/accordion-group.html',
    scope:{ heading:'@' },        // Create an isolated scope and interpolate the heading attribute onto this scope
    controller: ['$scope', function($scope) {
      this.setHeading = function(element) {
        this.heading = element;
      };
    }],
    link: function(scope, element, attrs, accordionCtrl) {
      var getIsOpen, setIsOpen;

      accordionCtrl.addGroup(scope);

      scope.isOpen = false;
      
      if ( attrs.isOpen ) {
        getIsOpen = $parse(attrs.isOpen);
        setIsOpen = getIsOpen.assign;

        scope.$watch(
          function watchIsOpen() { return getIsOpen(scope.$parent); },
          function updateOpen(value) { scope.isOpen = value; }
        );
        
        scope.isOpen = getIsOpen ? getIsOpen(scope.$parent) : false;
      }

      scope.$watch('isOpen', function(value) {
        if ( value ) {
          accordionCtrl.closeOthers(scope);
        }
        if ( setIsOpen ) {
          setIsOpen(scope.$parent, value);
        }
      });
    }
  };
}])

// Use accordion-heading below an accordion-group to provide a heading containing HTML
// <accordion-group>
//   <accordion-heading>Heading containing HTML - <img src="..."></accordion-heading>
// </accordion-group>
.directive('accordionHeading', function() {
  return {
    restrict: 'EA',
    transclude: true,   // Grab the contents to be used as the heading
    template: '',       // In effect remove this element!
    replace: true,
    require: '^accordionGroup',
    compile: function(element, attr, transclude) {
      return function link(scope, element, attr, accordionGroupCtrl) {
        // Pass the heading to the accordion-group controller
        // so that it can be transcluded into the right place in the template
        // [The second parameter to transclude causes the elements to be cloned so that they work in ng-repeat]
        accordionGroupCtrl.setHeading(transclude(scope, function() {}));
      };
    }
  };
})

// Use in the accordion-group template to indicate where you want the heading to be transcluded
// You must provide the property on the accordion-group controller that will hold the transcluded element
// <div class="accordion-group">
//   <div class="accordion-heading" ><a ... accordion-transclude="heading">...</a></div>
//   ...
// </div>
.directive('accordionTransclude', function() {
  return {
    require: '^accordionGroup',
    link: function(scope, element, attr, controller) {
      scope.$watch(function() { return controller[attr.accordionTransclude]; }, function(heading) {
        if ( heading ) {
          element.html('');
          element.append(heading);
        }
      });
    }
  };
});

angular.module("ui.bootstrap.alert", []).directive('alert', function () {
  return {
    restrict:'EA',
    templateUrl:'template/alert/alert.html',
    transclude:true,
    replace:true,
    scope: {
      type: '=',
      close: '&'
    },
    link: function(scope, iElement, iAttrs, controller) {
      scope.closeable = "close" in iAttrs;
    }
  };
});

angular.module('ui.bootstrap.bindHtml', [])

  .directive('bindHtmlUnsafe', function () {
    return function (scope, element, attr) {
      element.addClass('ng-binding').data('$binding', attr.bindHtmlUnsafe);
      scope.$watch(attr.bindHtmlUnsafe, function bindHtmlUnsafeWatchAction(value) {
        element.html(value || '');
      });
    };
  });
angular.module('ui.bootstrap.buttons', [])

  .constant('buttonConfig', {
    activeClass:'active',
    toggleEvent:'click'
  })

  .directive('btnRadio', ['buttonConfig', function (buttonConfig) {
  var activeClass = buttonConfig.activeClass || 'active';
  var toggleEvent = buttonConfig.toggleEvent || 'click';

  return {

    require:'ngModel',
    link:function (scope, element, attrs, ngModelCtrl) {

      //model -> UI
      ngModelCtrl.$render = function () {
        element.toggleClass(activeClass, angular.equals(ngModelCtrl.$modelValue, scope.$eval(attrs.btnRadio)));
      };

      //ui->model
      element.bind(toggleEvent, function () {
        if (!element.hasClass(activeClass)) {
          scope.$apply(function () {
            ngModelCtrl.$setViewValue(scope.$eval(attrs.btnRadio));
            ngModelCtrl.$render();
          });
        }
      });
    }
  };
}])

  .directive('btnCheckbox', ['buttonConfig', function (buttonConfig) {

  var activeClass = buttonConfig.activeClass || 'active';
  var toggleEvent = buttonConfig.toggleEvent || 'click';

  return {
    require:'ngModel',
    link:function (scope, element, attrs, ngModelCtrl) {

      function getTrueValue() {
        var trueValue = scope.$eval(attrs.btnCheckboxTrue);
        return angular.isDefined(trueValue) ? trueValue : true;
      }

      function getFalseValue() {
        var falseValue = scope.$eval(attrs.btnCheckboxFalse);
        return angular.isDefined(falseValue) ? falseValue : false;
      }

      //model -> UI
      ngModelCtrl.$render = function () {
        element.toggleClass(activeClass, angular.equals(ngModelCtrl.$modelValue, getTrueValue()));
      };

      //ui->model
      element.bind(toggleEvent, function () {
        scope.$apply(function () {
          ngModelCtrl.$setViewValue(element.hasClass(activeClass) ? getFalseValue() : getTrueValue());
          ngModelCtrl.$render();
        });
      });
    }
  };
}]);
/**
* @ngdoc overview
* @name ui.bootstrap.carousel
*
* @description
* AngularJS version of an image carousel.
*
*/
angular.module('ui.bootstrap.carousel', ['ui.bootstrap.transition'])
.controller('CarouselController', ['$scope', '$timeout', '$transition', '$q', function ($scope, $timeout, $transition, $q) {
  var self = this,
    slides = self.slides = [],
    currentIndex = -1,
    currentTimeout, isPlaying;
  self.currentSlide = null;

  /* direction: "prev" or "next" */
  self.select = function(nextSlide, direction) {
    var nextIndex = slides.indexOf(nextSlide);
    //Decide direction if it's not given
    if (direction === undefined) {
      direction = nextIndex > currentIndex ? "next" : "prev";
    }
    if (nextSlide && nextSlide !== self.currentSlide) {
      if ($scope.$currentTransition) {
        $scope.$currentTransition.cancel();
        //Timeout so ng-class in template has time to fix classes for finished slide
        $timeout(goNext);
      } else {
        goNext();
      }
    }
    function goNext() {
      //If we have a slide to transition from and we have a transition type and we're allowed, go
      if (self.currentSlide && angular.isString(direction) && !$scope.noTransition && nextSlide.$element) {
        //We shouldn't do class manip in here, but it's the same weird thing bootstrap does. need to fix sometime
        nextSlide.$element.addClass(direction);
        var reflow = nextSlide.$element[0].offsetWidth; //force reflow

        //Set all other slides to stop doing their stuff for the new transition
        angular.forEach(slides, function(slide) {
          angular.extend(slide, {direction: '', entering: false, leaving: false, active: false});
        });
        angular.extend(nextSlide, {direction: direction, active: true, entering: true});
        angular.extend(self.currentSlide||{}, {direction: direction, leaving: true});

        $scope.$currentTransition = $transition(nextSlide.$element, {});
        //We have to create new pointers inside a closure since next & current will change
        (function(next,current) {
          $scope.$currentTransition.then(
            function(){ transitionDone(next, current); },
            function(){ transitionDone(next, current); }
          );
        }(nextSlide, self.currentSlide));
      } else {
        transitionDone(nextSlide, self.currentSlide);
      }
      self.currentSlide = nextSlide;
      currentIndex = nextIndex;
      //every time you change slides, reset the timer
      restartTimer();
    }
    function transitionDone(next, current) {
      angular.extend(next, {direction: '', active: true, leaving: false, entering: false});
      angular.extend(current||{}, {direction: '', active: false, leaving: false, entering: false});
      $scope.$currentTransition = null;
    }
  };

  /* Allow outside people to call indexOf on slides array */
  self.indexOfSlide = function(slide) {
    return slides.indexOf(slide);
  };

  $scope.next = function() {
    var newIndex = (currentIndex + 1) % slides.length;

    //Prevent this user-triggered transition from occurring if there is already one in progress
    if (!$scope.$currentTransition) {
      return self.select(slides[newIndex], 'next');
    }
  };

  $scope.prev = function() {
    var newIndex = currentIndex - 1 < 0 ? slides.length - 1 : currentIndex - 1;

    //Prevent this user-triggered transition from occurring if there is already one in progress
    if (!$scope.$currentTransition) {
      return self.select(slides[newIndex], 'prev');
    }
  };

  $scope.select = function(slide) {
    self.select(slide);
  };

  $scope.isActive = function(slide) {
     return self.currentSlide === slide;
  };

  $scope.slides = function() {
    return slides;
  };

  $scope.$watch('interval', restartTimer);
  function restartTimer() {
    if (currentTimeout) {
      $timeout.cancel(currentTimeout);
    }
    function go() {
      if (isPlaying) {
        $scope.next();
        restartTimer();
      } else {
        $scope.pause();
      }
    }
    var interval = +$scope.interval;
    if (!isNaN(interval) && interval>=0) {
      currentTimeout = $timeout(go, interval);
    }
  }
  $scope.play = function() {
    if (!isPlaying) {
      isPlaying = true;
      restartTimer();
    }
  };
  $scope.pause = function() {
    if (!$scope.noPause) {
      isPlaying = false;
      if (currentTimeout) {
        $timeout.cancel(currentTimeout);
      }
    }
  };

  self.addSlide = function(slide, element) {
    slide.$element = element;
    slides.push(slide);
    //if this is the first slide or the slide is set to active, select it
    if(slides.length === 1 || slide.active) {
      self.select(slides[slides.length-1]);
      if (slides.length == 1) {
        $scope.play();
      }
    } else {
      slide.active = false;
    }
  };

  self.removeSlide = function(slide) {
    //get the index of the slide inside the carousel
    var index = slides.indexOf(slide);
    slides.splice(index, 1);
    if (slides.length > 0 && slide.active) {
      if (index >= slides.length) {
        self.select(slides[index-1]);
      } else {
        self.select(slides[index]);
      }
    } else if (currentIndex > index) {
      currentIndex--;
    }
  };
}])

/**
 * @ngdoc directive
 * @name ui.bootstrap.carousel.directive:carousel
 * @restrict EA
 *
 * @description
 * Carousel is the outer container for a set of image 'slides' to showcase.
 *
 * @param {number=} interval The time, in milliseconds, that it will take the carousel to go to the next slide.
 * @param {boolean=} noTransition Whether to disable transitions on the carousel.
 * @param {boolean=} noPause Whether to disable pausing on the carousel (by default, the carousel interval pauses on hover).
 *
 * @example
<example module="ui.bootstrap">
  <file name="index.html">
    <carousel>
      <slide>
        <img src="http://placekitten.com/150/150" style="margin:auto;">
        <div class="carousel-caption">
          <p>Beautiful!</p>
        </div>
      </slide>
      <slide>
        <img src="http://placekitten.com/100/150" style="margin:auto;">
        <div class="carousel-caption">
          <p>D'aww!</p>
        </div>
      </slide>
    </carousel>
  </file>
  <file name="demo.css">
    .carousel-indicators {
      top: auto;
      bottom: 15px;
    }
  </file>
</example>
 */
.directive('carousel', [function() {
  return {
    restrict: 'EA',
    transclude: true,
    replace: true,
    controller: 'CarouselController',
    require: 'carousel',
    templateUrl: 'template/carousel/carousel.html',
    scope: {
      interval: '=',
      noTransition: '=',
      noPause: '='
    }
  };
}])

/**
 * @ngdoc directive
 * @name ui.bootstrap.carousel.directive:slide
 * @restrict EA
 *
 * @description
 * Creates a slide inside a {@link ui.bootstrap.carousel.directive:carousel carousel}.  Must be placed as a child of a carousel element.
 *
 * @param {boolean=} active Model binding, whether or not this slide is currently active.
 *
 * @example
<example module="ui.bootstrap">
  <file name="index.html">
<div ng-controller="CarouselDemoCtrl">
  <carousel>
    <slide ng-repeat="slide in slides" active="slide.active">
      <img ng-src="{{slide.image}}" style="margin:auto;">
      <div class="carousel-caption">
        <h4>Slide {{$index}}</h4>
        <p>{{slide.text}}</p>
      </div>
    </slide>
  </carousel>
  <div class="row-fluid">
    <div class="span6">
      <ul>
        <li ng-repeat="slide in slides">
          <button class="btn btn-mini" ng-class="{'btn-info': !slide.active, 'btn-success': slide.active}" ng-disabled="slide.active" ng-click="slide.active = true">select</button>
          {{$index}}: {{slide.text}}
        </li>
      </ul>
      <a class="btn" ng-click="addSlide()">Add Slide</a>
    </div>
    <div class="span6">
      Interval, in milliseconds: <input type="number" ng-model="myInterval">
      <br />Enter a negative number to stop the interval.
    </div>
  </div>
</div>
  </file>
  <file name="script.js">
function CarouselDemoCtrl($scope) {
  $scope.myInterval = 5000;
  var slides = $scope.slides = [];
  $scope.addSlide = function() {
    var newWidth = 200 + ((slides.length + (25 * slides.length)) % 150);
    slides.push({
      image: 'http://placekitten.com/' + newWidth + '/200',
      text: ['More','Extra','Lots of','Surplus'][slides.length % 4] + ' '
        ['Cats', 'Kittys', 'Felines', 'Cutes'][slides.length % 4]
    });
  };
  for (var i=0; i<4; i++) $scope.addSlide();
}
  </file>
  <file name="demo.css">
    .carousel-indicators {
      top: auto;
      bottom: 15px;
    }
  </file>
</example>
*/

.directive('slide', ['$parse', function($parse) {
  return {
    require: '^carousel',
    restrict: 'EA',
    transclude: true,
    replace: true,
    templateUrl: 'template/carousel/slide.html',
    scope: {
    },
    link: function (scope, element, attrs, carouselCtrl) {
      //Set up optional 'active' = binding
      if (attrs.active) {
        var getActive = $parse(attrs.active);
        var setActive = getActive.assign;
        var lastValue = scope.active = getActive(scope.$parent);
        scope.$watch(function parentActiveWatch() {
          var parentActive = getActive(scope.$parent);

          if (parentActive !== scope.active) {
            // we are out of sync and need to copy
            if (parentActive !== lastValue) {
              // parent changed and it has precedence
              lastValue = scope.active = parentActive;
            } else {
              // if the parent can be assigned then do so
              setActive(scope.$parent, parentActive = lastValue = scope.active);
            }
          }
          return parentActive;
        });
      }

      carouselCtrl.addSlide(scope, element);
      //when the scope is destroyed then remove the slide from the current slides array
      scope.$on('$destroy', function() {
        carouselCtrl.removeSlide(scope);
      });

      scope.$watch('active', function(active) {
        if (active) {
          carouselCtrl.select(scope);
        }
      });
    }
  };
}]);

angular.module('ui.bootstrap.position', [])

/**
 * A set of utility methods that can be use to retrieve position of DOM elements.
 * It is meant to be used where we need to absolute-position DOM elements in
 * relation to other, existing elements (this is the case for tooltips, popovers,
 * typeahead suggestions etc.).
 */
  .factory('$position', ['$document', '$window', function ($document, $window) {

    function getStyle(el, cssprop) {
      if (el.currentStyle) { //IE
        return el.currentStyle[cssprop];
      } else if ($window.getComputedStyle) {
        return $window.getComputedStyle(el)[cssprop];
      }
      // finally try and get inline style
      return el.style[cssprop];
    }

    /**
     * Checks if a given element is statically positioned
     * @param element - raw DOM element
     */
    function isStaticPositioned(element) {
      return (getStyle(element, "position") || 'static' ) === 'static';
    }

    /**
     * returns the closest, non-statically positioned parentOffset of a given element
     * @param element
     */
    var parentOffsetEl = function (element) {
      var docDomEl = $document[0];
      var offsetParent = element.offsetParent || docDomEl;
      while (offsetParent && offsetParent !== docDomEl && isStaticPositioned(offsetParent) ) {
        offsetParent = offsetParent.offsetParent;
      }
      return offsetParent || docDomEl;
    };

    return {
      /**
       * Provides read-only equivalent of jQuery's position function:
       * http://api.jquery.com/position/
       */
      position: function (element) {
        var elBCR = this.offset(element);
        var offsetParentBCR = { top: 0, left: 0 };
        var offsetParentEl = parentOffsetEl(element[0]);
        if (offsetParentEl != $document[0]) {
          offsetParentBCR = this.offset(angular.element(offsetParentEl));
          offsetParentBCR.top += offsetParentEl.clientTop - offsetParentEl.scrollTop;
          offsetParentBCR.left += offsetParentEl.clientLeft - offsetParentEl.scrollLeft;
        }

        return {
          width: element.prop('offsetWidth'),
          height: element.prop('offsetHeight'),
          top: elBCR.top - offsetParentBCR.top,
          left: elBCR.left - offsetParentBCR.left
        };
      },

      /**
       * Provides read-only equivalent of jQuery's offset function:
       * http://api.jquery.com/offset/
       */
      offset: function (element) {
        var boundingClientRect = element[0].getBoundingClientRect();
        return {
          width: element.prop('offsetWidth'),
          height: element.prop('offsetHeight'),
          top: boundingClientRect.top + ($window.pageYOffset || $document[0].body.scrollTop || $document[0].documentElement.scrollTop),
          left: boundingClientRect.left + ($window.pageXOffset || $document[0].body.scrollLeft  || $document[0].documentElement.scrollLeft)
        };
      }
    };
  }]);

angular.module('ui.bootstrap.datepicker', ['ui.bootstrap.position'])

.constant('datepickerConfig', {
  dayFormat: 'dd',
  monthFormat: 'MMMM',
  yearFormat: 'yyyy',
  dayHeaderFormat: 'EEE',
  dayTitleFormat: 'MMMM yyyy',
  monthTitleFormat: 'yyyy',
  showWeeks: true,
  startingDay: 0,
  yearRange: 20,
  minDate: null,
  maxDate: null
})

.controller('DatepickerController', ['$scope', '$attrs', 'dateFilter', 'datepickerConfig', function($scope, $attrs, dateFilter, dtConfig) {
  var format = {
    day:        getValue($attrs.dayFormat,        dtConfig.dayFormat),
    month:      getValue($attrs.monthFormat,      dtConfig.monthFormat),
    year:       getValue($attrs.yearFormat,       dtConfig.yearFormat),
    dayHeader:  getValue($attrs.dayHeaderFormat,  dtConfig.dayHeaderFormat),
    dayTitle:   getValue($attrs.dayTitleFormat,   dtConfig.dayTitleFormat),
    monthTitle: getValue($attrs.monthTitleFormat, dtConfig.monthTitleFormat)
  },
  startingDay = getValue($attrs.startingDay,      dtConfig.startingDay),
  yearRange =   getValue($attrs.yearRange,        dtConfig.yearRange);

  this.minDate = dtConfig.minDate ? new Date(dtConfig.minDate) : null;
  this.maxDate = dtConfig.maxDate ? new Date(dtConfig.maxDate) : null;

  function getValue(value, defaultValue) {
    return angular.isDefined(value) ? $scope.$parent.$eval(value) : defaultValue;
  }

  function getDaysInMonth( year, month ) {
    return new Date(year, month, 0).getDate();
  }

  function getDates(startDate, n) {
    var dates = new Array(n);
    var current = startDate, i = 0;
    while (i < n) {
      dates[i++] = new Date(current);
      current.setDate( current.getDate() + 1 );
    }
    return dates;
  }

  function makeDate(date, format, isSelected, isSecondary) {
    return { date: date, label: dateFilter(date, format), selected: !!isSelected, secondary: !!isSecondary };
  }

  this.modes = [
    {
      name: 'day',
      getVisibleDates: function(date, selected) {
        var year = date.getFullYear(), month = date.getMonth(), firstDayOfMonth = new Date(year, month, 1);
        var difference = startingDay - firstDayOfMonth.getDay(),
        numDisplayedFromPreviousMonth = (difference > 0) ? 7 - difference : - difference,
        firstDate = new Date(firstDayOfMonth), numDates = 0;

        if ( numDisplayedFromPreviousMonth > 0 ) {
          firstDate.setDate( - numDisplayedFromPreviousMonth + 1 );
          numDates += numDisplayedFromPreviousMonth; // Previous
        }
        numDates += getDaysInMonth(year, month + 1); // Current
        numDates += (7 - numDates % 7) % 7; // Next

        var days = getDates(firstDate, numDates), labels = new Array(7);
        for (var i = 0; i < numDates; i ++) {
          var dt = new Date(days[i]);
          days[i] = makeDate(dt, format.day, (selected && selected.getDate() === dt.getDate() && selected.getMonth() === dt.getMonth() && selected.getFullYear() === dt.getFullYear()), dt.getMonth() !== month);
        }
        for (var j = 0; j < 7; j++) {
          labels[j] = dateFilter(days[j].date, format.dayHeader);
        }
        return { objects: days, title: dateFilter(date, format.dayTitle), labels: labels };
      },
      compare: function(date1, date2) {
        return (new Date( date1.getFullYear(), date1.getMonth(), date1.getDate() ) - new Date( date2.getFullYear(), date2.getMonth(), date2.getDate() ) );
      },
      split: 7,
      step: { months: 1 }
    },
    {
      name: 'month',
      getVisibleDates: function(date, selected) {
        var months = new Array(12), year = date.getFullYear();
        for ( var i = 0; i < 12; i++ ) {
          var dt = new Date(year, i, 1);
          months[i] = makeDate(dt, format.month, (selected && selected.getMonth() === i && selected.getFullYear() === year));
        }
        return { objects: months, title: dateFilter(date, format.monthTitle) };
      },
      compare: function(date1, date2) {
        return new Date( date1.getFullYear(), date1.getMonth() ) - new Date( date2.getFullYear(), date2.getMonth() );
      },
      split: 3,
      step: { years: 1 }
    },
    {
      name: 'year',
      getVisibleDates: function(date, selected) {
        var years = new Array(yearRange), year = date.getFullYear(), startYear = parseInt((year - 1) / yearRange, 10) * yearRange + 1;
        for ( var i = 0; i < yearRange; i++ ) {
          var dt = new Date(startYear + i, 0, 1);
          years[i] = makeDate(dt, format.year, (selected && selected.getFullYear() === dt.getFullYear()));
        }
        return { objects: years, title: [years[0].label, years[yearRange - 1].label].join(' - ') };
      },
      compare: function(date1, date2) {
        return date1.getFullYear() - date2.getFullYear();
      },
      split: 5,
      step: { years: yearRange }
    }
  ];

  this.isDisabled = function(date, mode) {
    var currentMode = this.modes[mode || 0];
    return ((this.minDate && currentMode.compare(date, this.minDate) < 0) || (this.maxDate && currentMode.compare(date, this.maxDate) > 0) || ($scope.dateDisabled && $scope.dateDisabled({date: date, mode: currentMode.name})));
  };
}])

.directive( 'datepicker', ['dateFilter', '$parse', 'datepickerConfig', '$log', function (dateFilter, $parse, datepickerConfig, $log) {
  return {
    restrict: 'EA',
    replace: true,
    templateUrl: 'template/datepicker/datepicker.html',
    scope: {
      dateDisabled: '&'
    },
    require: ['datepicker', '?^ngModel'],
    controller: 'DatepickerController',
    link: function(scope, element, attrs, ctrls) {
      var datepickerCtrl = ctrls[0], ngModel = ctrls[1];

      if (!ngModel) {
        return; // do nothing if no ng-model
      }

      // Configuration parameters
      var mode = 0, selected = new Date(), showWeeks = datepickerConfig.showWeeks;

      if (attrs.showWeeks) {
        scope.$parent.$watch($parse(attrs.showWeeks), function(value) {
          showWeeks = !! value;
          updateShowWeekNumbers();
        });
      } else {
        updateShowWeekNumbers();
      }

      if (attrs.min) {
        scope.$parent.$watch($parse(attrs.min), function(value) {
          datepickerCtrl.minDate = value ? new Date(value) : null;
          refill();
        });
      }
      if (attrs.max) {
        scope.$parent.$watch($parse(attrs.max), function(value) {
          datepickerCtrl.maxDate = value ? new Date(value) : null;
          refill();
        });
      }

      function updateShowWeekNumbers() {
        scope.showWeekNumbers = mode === 0 && showWeeks;
      }

      // Split array into smaller arrays
      function split(arr, size) {
        var arrays = [];
        while (arr.length > 0) {
          arrays.push(arr.splice(0, size));
        }
        return arrays;
      }

      function refill( updateSelected ) {
        var date = null, valid = true;

        if ( ngModel.$modelValue ) {
          date = new Date( ngModel.$modelValue );

          if ( isNaN(date) ) {
            valid = false;
            $log.error('Datepicker directive: "ng-model" value must be a Date object, a number of milliseconds since 01.01.1970 or a string representing an RFC2822 or ISO 8601 date.');
          } else if ( updateSelected ) {
            selected = date;
          }
        }
        ngModel.$setValidity('date', valid);

        var currentMode = datepickerCtrl.modes[mode], data = currentMode.getVisibleDates(selected, date);
        angular.forEach(data.objects, function(obj) {
          obj.disabled = datepickerCtrl.isDisabled(obj.date, mode);
        });

        ngModel.$setValidity('date-disabled', (!date || !datepickerCtrl.isDisabled(date)));

        scope.rows = split(data.objects, currentMode.split);
        scope.labels = data.labels || [];
        scope.title = data.title;
      }

      function setMode(value) {
        mode = value;
        updateShowWeekNumbers();
        refill();
      }

      ngModel.$render = function() {
        refill( true );
      };

      scope.select = function( date ) {
        if ( mode === 0 ) {
          var dt = new Date( ngModel.$modelValue );
          dt.setFullYear( date.getFullYear(), date.getMonth(), date.getDate() );
          ngModel.$setViewValue( dt );
          refill( true );
        } else {
          selected = date;
          setMode( mode - 1 );
        }
      };
      scope.move = function(direction) {
        var step = datepickerCtrl.modes[mode].step;
        selected.setMonth( selected.getMonth() + direction * (step.months || 0) );
        selected.setFullYear( selected.getFullYear() + direction * (step.years || 0) );
        refill();
      };
      scope.toggleMode = function() {
        setMode( (mode + 1) % datepickerCtrl.modes.length );
      };
      scope.getWeekNumber = function(row) {
        return ( mode === 0 && scope.showWeekNumbers && row.length === 7 ) ? getISO8601WeekNumber(row[0].date) : null;
      };

      function getISO8601WeekNumber(date) {
        var checkDate = new Date(date);
        checkDate.setDate(checkDate.getDate() + 4 - (checkDate.getDay() || 7)); // Thursday
        var time = checkDate.getTime();
        checkDate.setMonth(0); // Compare with Jan 1
        checkDate.setDate(1);
        return Math.floor(Math.round((time - checkDate) / 86400000) / 7) + 1;
      }
    }
  };
}])

.constant('datepickerPopupConfig', {
  dateFormat: 'yyyy-MM-dd',
  closeOnDateSelection: true
})

.directive('datepickerPopup', ['$compile', '$parse', '$document', '$position', 'dateFilter', 'datepickerPopupConfig',
function ($compile, $parse, $document, $position, dateFilter, datepickerPopupConfig) {
  return {
    restrict: 'EA',
    require: 'ngModel',
    link: function(originalScope, element, attrs, ngModel) {

      var closeOnDateSelection = angular.isDefined(attrs.closeOnDateSelection) ? scope.$eval(attrs.closeOnDateSelection) : datepickerPopupConfig.closeOnDateSelection;
      var dateFormat = attrs.datepickerPopup || datepickerPopupConfig.dateFormat;

     // create a child scope for the datepicker directive so we are not polluting original scope
      var scope = originalScope.$new();
      originalScope.$on('$destroy', function() {
        scope.$destroy();
      });

      var getIsOpen, setIsOpen;
      if ( attrs.isOpen ) {
        getIsOpen = $parse(attrs.isOpen);
        setIsOpen = getIsOpen.assign;

        originalScope.$watch(getIsOpen, function updateOpen(value) {
          scope.isOpen = !! value;
        });
      }
      scope.isOpen = getIsOpen ? getIsOpen(originalScope) : false; // Initial state

      function setOpen( value ) {
        if (setIsOpen) {
          setIsOpen(originalScope, !!value);
        } else {
          scope.isOpen = !!value;
        }
      }

      var documentClickBind = function(event) {
        if (scope.isOpen && event.target !== element[0]) {
          scope.$apply(function() {
            setOpen(false);
          });
        }
      };

      var elementFocusBind = function() {
        scope.$apply(function() {
          setOpen( true );
        });
      };

      // popup element used to display calendar
      var popupEl = angular.element('<datepicker-popup-wrap><datepicker></datepicker></datepicker-popup-wrap>');
      popupEl.attr({
        'ng-model': 'date',
        'ng-change': 'dateSelection()'
      });
      var datepickerEl = popupEl.find('datepicker');
      if (attrs.datepickerOptions) {
        datepickerEl.attr(angular.extend({}, originalScope.$eval(attrs.datepickerOptions)));
      }

      // TODO: reverse from dateFilter string to Date object
      function parseDate(viewValue) {
        if (!viewValue) {
          ngModel.$setValidity('date', true);
          return null;
        } else if (angular.isDate(viewValue)) {
          ngModel.$setValidity('date', true);
          return viewValue;
        } else if (angular.isString(viewValue)) {
          var date = new Date(viewValue);
          if (isNaN(date)) {
            ngModel.$setValidity('date', false);
            return undefined;
          } else {
            ngModel.$setValidity('date', true);
            return date;
          }
        } else {
          ngModel.$setValidity('date', false);
          return undefined;
        }
      }
      ngModel.$parsers.unshift(parseDate);

      // Inner change
      scope.dateSelection = function() {
        ngModel.$setViewValue(scope.date);
        ngModel.$render();

        if (closeOnDateSelection) {
          setOpen( false );
        }
      };

      element.bind('input change keyup', function() {
        scope.$apply(function() {
          updateCalendar();
        });
      });

      // Outter change
      ngModel.$render = function() {
        var date = ngModel.$viewValue ? dateFilter(ngModel.$viewValue, dateFormat) : '';
        element.val(date);

        updateCalendar();
      };

      function updateCalendar() {
        scope.date = ngModel.$modelValue;
        updatePosition();
      }

      function addWatchableAttribute(attribute, scopeProperty, datepickerAttribute) {
        if (attribute) {
          originalScope.$watch($parse(attribute), function(value){
            scope[scopeProperty] = value;
          });
          datepickerEl.attr(datepickerAttribute || scopeProperty, scopeProperty);
        }
      }
      addWatchableAttribute(attrs.min, 'min');
      addWatchableAttribute(attrs.max, 'max');
      if (attrs.showWeeks) {
        addWatchableAttribute(attrs.showWeeks, 'showWeeks', 'show-weeks');
      } else {
        scope.showWeeks = true;
        datepickerEl.attr('show-weeks', 'showWeeks');
      }
      if (attrs.dateDisabled) {
        datepickerEl.attr('date-disabled', attrs.dateDisabled);
      }

      function updatePosition() {
        scope.position = $position.position(element);
        scope.position.top = scope.position.top + element.prop('offsetHeight');
      }

      var documentBindingInitialized = false, elementFocusInitialized = false;
      scope.$watch('isOpen', function(value) {
        if (value) {
          updatePosition();
          $document.bind('click', documentClickBind);
          if(elementFocusInitialized) {
            element.unbind('focus', elementFocusBind);
          }
          element[0].focus();
          documentBindingInitialized = true;
        } else {
          if(documentBindingInitialized) {
            $document.unbind('click', documentClickBind);
          }
          element.bind('focus', elementFocusBind);
          elementFocusInitialized = true;
        }

        if ( setIsOpen ) {
          setIsOpen(originalScope, value);
        }
      });

      var $setModelValue = $parse(attrs.ngModel).assign;

      scope.today = function() {
        $setModelValue(originalScope, new Date());
      };
      scope.clear = function() {
        $setModelValue(originalScope, null);
      };

      element.after($compile(popupEl)(scope));
    }
  };
}])

.directive('datepickerPopupWrap', [function() {
  return {
    restrict:'E',
    replace: true,
    transclude: true,
    templateUrl: 'template/datepicker/popup.html',
    link:function (scope, element, attrs) {
      element.bind('click', function(event) {
        event.preventDefault();
        event.stopPropagation();
      });
    }
  };
}]);

/*
 * dropdownToggle - Provides dropdown menu functionality in place of bootstrap js
 * @restrict class or attribute
 * @example:
   <li class="dropdown">
     <a class="dropdown-toggle">My Dropdown Menu</a>
     <ul class="dropdown-menu">
       <li ng-repeat="choice in dropChoices">
         <a ng-href="{{choice.href}}">{{choice.text}}</a>
       </li>
     </ul>
   </li>
 */

angular.module('ui.bootstrap.dropdownToggle', []).directive('dropdownToggle', ['$document', '$location', function ($document, $location) {
  var openElement = null,
      closeMenu   = angular.noop;
  return {
    restrict: 'CA',
    link: function(scope, element, attrs) {
      scope.$watch('$location.path', function() { closeMenu(); });
      element.parent().bind('click', function() { closeMenu(); });
      element.bind('click', function (event) {

        var elementWasOpen = (element === openElement);

        event.preventDefault();
        event.stopPropagation();

        if (!!openElement) {
          closeMenu();
        }

        if (!elementWasOpen) {
          element.parent().addClass('open');
          openElement = element;
          closeMenu = function (event) {
            if (event) {
              event.preventDefault();
              event.stopPropagation();
            }
            $document.unbind('click', closeMenu);
            element.parent().removeClass('open');
            closeMenu = angular.noop;
            openElement = null;
          };
          $document.bind('click', closeMenu);
        }
      });
    }
  };
}]);
angular.module('ui.bootstrap.modal', [])

/**
 * A helper, internal data structure that acts as a map but also allows getting / removing
 * elements in the LIFO order
 */
  .factory('$$stackedMap', function () {
    return {
      createNew: function () {
        var stack = [];

        return {
          add: function (key, value) {
            stack.push({
              key: key,
              value: value
            });
          },
          get: function (key) {
            for (var i = 0; i < stack.length; i++) {
              if (key == stack[i].key) {
                return stack[i];
              }
            }
          },
          keys: function() {
            var keys = [];
            for (var i = 0; i < stack.length; i++) {
              keys.push(stack[i].key);
            }
            return keys;
          },
          top: function () {
            return stack[stack.length - 1];
          },
          remove: function (key) {
            var idx = -1;
            for (var i = 0; i < stack.length; i++) {
              if (key == stack[i].key) {
                idx = i;
                break;
              }
            }
            return stack.splice(idx, 1)[0];
          },
          removeTop: function () {
            return stack.splice(stack.length - 1, 1)[0];
          },
          length: function () {
            return stack.length;
          }
        };
      }
    };
  })

/**
 * A helper directive for the $modal service. It creates a backdrop element.
 */
  .directive('modalBackdrop', ['$modalStack', '$timeout', function ($modalStack, $timeout) {
    return {
      restrict: 'EA',
      replace: true,
      templateUrl: 'template/modal/backdrop.html',
      link: function (scope, element, attrs) {

        //trigger CSS transitions
        $timeout(function () {
          scope.animate = true;
        });

        scope.close = function (evt) {
          var modal = $modalStack.getTop();
          if (modal && modal.value.backdrop && modal.value.backdrop != 'static') {
            evt.preventDefault();
            evt.stopPropagation();
            $modalStack.dismiss(modal.key, 'backdrop click');
          }
        };
      }
    };
  }])

  .directive('modalWindow', ['$timeout', function ($timeout) {
    return {
      restrict: 'EA',
      scope: {
        index: '@'
      },
      replace: true,
      transclude: true,
      templateUrl: 'template/modal/window.html',
      link: function (scope, element, attrs) {
        scope.windowClass = attrs.windowClass || '';

        //trigger CSS transitions
        $timeout(function () {
          scope.animate = true;
        });
      }
    };
  }])

  .factory('$modalStack', ['$document', '$compile', '$rootScope', '$$stackedMap',
    function ($document, $compile, $rootScope, $$stackedMap) {

      var backdropjqLiteEl, backdropDomEl;
      var backdropScope = $rootScope.$new(true);
      var body = $document.find('body').eq(0);
      var openedWindows = $$stackedMap.createNew();
      var $modalStack = {};

      function backdropIndex() {
        var topBackdropIndex = -1;
        var opened = openedWindows.keys();
        for (var i = 0; i < opened.length; i++) {
          if (openedWindows.get(opened[i]).value.backdrop) {
            topBackdropIndex = i;
          }
        }
        return topBackdropIndex;
      }

      $rootScope.$watch(backdropIndex, function(newBackdropIndex){
        backdropScope.index = newBackdropIndex;
      });

      function removeModalWindow(modalInstance) {

        var modalWindow = openedWindows.get(modalInstance).value;

        //clean up the stack
        openedWindows.remove(modalInstance);

        //remove window DOM element
        modalWindow.modalDomEl.remove();

        //remove backdrop if no longer needed
        if (backdropIndex() == -1) {
          backdropDomEl.remove();
          backdropDomEl = undefined;
        }

        //destroy scope
        modalWindow.modalScope.$destroy();
      }

      $document.bind('keydown', function (evt) {
        var modal;

        if (evt.which === 27) {
          modal = openedWindows.top();
          if (modal && modal.value.keyboard) {
            $rootScope.$apply(function () {
              $modalStack.dismiss(modal.key);
            });
          }
        }
      });

      $modalStack.open = function (modalInstance, modal) {

        openedWindows.add(modalInstance, {
          deferred: modal.deferred,
          modalScope: modal.scope,
          backdrop: modal.backdrop,
          keyboard: modal.keyboard
        });

        var angularDomEl = angular.element('<div modal-window></div>');
        angularDomEl.attr('window-class', modal.windowClass);
        angularDomEl.attr('index', openedWindows.length() - 1);
        angularDomEl.html(modal.content);

        var modalDomEl = $compile(angularDomEl)(modal.scope);
        openedWindows.top().value.modalDomEl = modalDomEl;
        body.append(modalDomEl);

        if (backdropIndex() >= 0 && !backdropDomEl) {
            backdropjqLiteEl = angular.element('<div modal-backdrop></div>');
            backdropDomEl = $compile(backdropjqLiteEl)(backdropScope);
            body.append(backdropDomEl);
        }
      };

      $modalStack.close = function (modalInstance, result) {
        var modal = openedWindows.get(modalInstance);
        if (modal) {
          modal.value.deferred.resolve(result);
          removeModalWindow(modalInstance);
        }
      };

      $modalStack.dismiss = function (modalInstance, reason) {
        var modalWindow = openedWindows.get(modalInstance).value;
        if (modalWindow) {
          modalWindow.deferred.reject(reason);
          removeModalWindow(modalInstance);
        }
      };

      $modalStack.getTop = function () {
        return openedWindows.top();
      };

      return $modalStack;
    }])

  .provider('$modal', function () {

    var $modalProvider = {
      options: {
        backdrop: true, //can be also false or 'static'
        keyboard: true
      },
      $get: ['$injector', '$rootScope', '$q', '$http', '$templateCache', '$controller', '$modalStack',
        function ($injector, $rootScope, $q, $http, $templateCache, $controller, $modalStack) {

          var $modal = {};

          function getTemplatePromise(options) {
            return options.template ? $q.when(options.template) :
              $http.get(options.templateUrl, {cache: $templateCache}).then(function (result) {
                return result.data;
              });
          }

          function getResolvePromises(resolves) {
            var promisesArr = [];
            angular.forEach(resolves, function (value, key) {
              if (angular.isFunction(value) || angular.isArray(value)) {
                promisesArr.push($q.when($injector.invoke(value)));
              }
            });
            return promisesArr;
          }

          $modal.open = function (modalOptions) {

            var modalResultDeferred = $q.defer();
            var modalOpenedDeferred = $q.defer();

            //prepare an instance of a modal to be injected into controllers and returned to a caller
            var modalInstance = {
              result: modalResultDeferred.promise,
              opened: modalOpenedDeferred.promise,
              close: function (result) {
                $modalStack.close(modalInstance, result);
              },
              dismiss: function (reason) {
                $modalStack.dismiss(modalInstance, reason);
              }
            };

            //merge and clean up options
            modalOptions = angular.extend({}, $modalProvider.options, modalOptions);
            modalOptions.resolve = modalOptions.resolve || {};

            //verify options
            if (!modalOptions.template && !modalOptions.templateUrl) {
              throw new Error('One of template or templateUrl options is required.');
            }

            var templateAndResolvePromise =
              $q.all([getTemplatePromise(modalOptions)].concat(getResolvePromises(modalOptions.resolve)));


            templateAndResolvePromise.then(function resolveSuccess(tplAndVars) {

              var modalScope = (modalOptions.scope || $rootScope).$new();
              modalScope.$close = modalInstance.close;
              modalScope.$dismiss = modalInstance.dismiss;

              var ctrlInstance, ctrlLocals = {};
              var resolveIter = 1;

              //controllers
              if (modalOptions.controller) {
                ctrlLocals.$scope = modalScope;
                ctrlLocals.$modalInstance = modalInstance;
                angular.forEach(modalOptions.resolve, function (value, key) {
                  ctrlLocals[key] = tplAndVars[resolveIter++];
                });

                ctrlInstance = $controller(modalOptions.controller, ctrlLocals);
              }

              $modalStack.open(modalInstance, {
                scope: modalScope,
                deferred: modalResultDeferred,
                content: tplAndVars[0],
                backdrop: modalOptions.backdrop,
                keyboard: modalOptions.keyboard,
                windowClass: modalOptions.windowClass
              });

            }, function resolveError(reason) {
              modalResultDeferred.reject(reason);
            });

            templateAndResolvePromise.then(function () {
              modalOpenedDeferred.resolve(true);
            }, function () {
              modalOpenedDeferred.reject(false);
            });

            return modalInstance;
          };

          return $modal;
        }]
    };

    return $modalProvider;
  });
angular.module('ui.bootstrap.pagination', [])

.controller('PaginationController', ['$scope', '$attrs', '$parse', '$interpolate', function ($scope, $attrs, $parse, $interpolate) {
  var self = this;

  this.init = function(defaultItemsPerPage) {
    if ($attrs.itemsPerPage) {
      $scope.$parent.$watch($parse($attrs.itemsPerPage), function(value) {
        self.itemsPerPage = parseInt(value, 10);
        $scope.totalPages = self.calculateTotalPages();
      });
    } else {
      this.itemsPerPage = defaultItemsPerPage;
    }
  };

  this.noPrevious = function() {
    return this.page === 1;
  };
  this.noNext = function() {
    return this.page === $scope.totalPages;
  };

  this.isActive = function(page) {
    return this.page === page;
  };

  this.calculateTotalPages = function() {
    return this.itemsPerPage < 1 ? 1 : Math.ceil($scope.totalItems / this.itemsPerPage);
  };

  this.getAttributeValue = function(attribute, defaultValue, interpolate) {
    return angular.isDefined(attribute) ? (interpolate ? $interpolate(attribute)($scope.$parent) : $scope.$parent.$eval(attribute)) : defaultValue;
  };

  this.render = function() {
    this.page = parseInt($scope.page, 10) || 1;
    $scope.pages = this.getPages(this.page, $scope.totalPages);
  };

  $scope.selectPage = function(page) {
    if ( ! self.isActive(page) && page > 0 && page <= $scope.totalPages) {
      $scope.page = page;
      $scope.onSelectPage({ page: page });
    }
  };

  $scope.$watch('totalItems', function() {
    $scope.totalPages = self.calculateTotalPages();
  });

  $scope.$watch('totalPages', function(value) {
    if ( $attrs.numPages ) {
      $scope.numPages = value; // Readonly variable
    }

    if ( self.page > value ) {
      $scope.selectPage(value);
    } else {
      self.render();
    }
  });

  $scope.$watch('page', function() {
    self.render();
  });
}])

.constant('paginationConfig', {
  itemsPerPage: 10,
  boundaryLinks: false,
  directionLinks: true,
  firstText: 'First',
  previousText: 'Previous',
  nextText: 'Next',
  lastText: 'Last',
  rotate: true
})

.directive('pagination', ['$parse', 'paginationConfig', function($parse, config) {
  return {
    restrict: 'EA',
    scope: {
      page: '=',
      totalItems: '=',
      onSelectPage:' &',
      numPages: '='
    },
    controller: 'PaginationController',
    templateUrl: 'template/pagination/pagination.html',
    replace: true,
    link: function(scope, element, attrs, paginationCtrl) {

      // Setup configuration parameters
      var maxSize,
      boundaryLinks  = paginationCtrl.getAttributeValue(attrs.boundaryLinks,  config.boundaryLinks      ),
      directionLinks = paginationCtrl.getAttributeValue(attrs.directionLinks, config.directionLinks     ),
      firstText      = paginationCtrl.getAttributeValue(attrs.firstText,      config.firstText,     true),
      previousText   = paginationCtrl.getAttributeValue(attrs.previousText,   config.previousText,  true),
      nextText       = paginationCtrl.getAttributeValue(attrs.nextText,       config.nextText,      true),
      lastText       = paginationCtrl.getAttributeValue(attrs.lastText,       config.lastText,      true),
      rotate         = paginationCtrl.getAttributeValue(attrs.rotate,         config.rotate);

      paginationCtrl.init(config.itemsPerPage);

      if (attrs.maxSize) {
        scope.$parent.$watch($parse(attrs.maxSize), function(value) {
          maxSize = parseInt(value, 10);
          paginationCtrl.render();
        });
      }

      // Create page object used in template
      function makePage(number, text, isActive, isDisabled) {
        return {
          number: number,
          text: text,
          active: isActive,
          disabled: isDisabled
        };
      }

      paginationCtrl.getPages = function(currentPage, totalPages) {
        var pages = [];

        // Default page limits
        var startPage = 1, endPage = totalPages;
        var isMaxSized = ( angular.isDefined(maxSize) && maxSize < totalPages );

        // recompute if maxSize
        if ( isMaxSized ) {
          if ( rotate ) {
            // Current page is displayed in the middle of the visible ones
            startPage = Math.max(currentPage - Math.floor(maxSize/2), 1);
            endPage   = startPage + maxSize - 1;

            // Adjust if limit is exceeded
            if (endPage > totalPages) {
              endPage   = totalPages;
              startPage = endPage - maxSize + 1;
            }
          } else {
            // Visible pages are paginated with maxSize
            startPage = ((Math.ceil(currentPage / maxSize) - 1) * maxSize) + 1;

            // Adjust last page if limit is exceeded
            endPage = Math.min(startPage + maxSize - 1, totalPages);
          }
        }

        // Add page number links
        for (var number = startPage; number <= endPage; number++) {
          var page = makePage(number, number, paginationCtrl.isActive(number), false);
          pages.push(page);
        }

        // Add links to move between page sets
        if ( isMaxSized && ! rotate ) {
          if ( startPage > 1 ) {
            var previousPageSet = makePage(startPage - 1, '...', false, false);
            pages.unshift(previousPageSet);
          }

          if ( endPage < totalPages ) {
            var nextPageSet = makePage(endPage + 1, '...', false, false);
            pages.push(nextPageSet);
          }
        }

        // Add previous & next links
        if (directionLinks) {
          var previousPage = makePage(currentPage - 1, previousText, false, paginationCtrl.noPrevious());
          pages.unshift(previousPage);

          var nextPage = makePage(currentPage + 1, nextText, false, paginationCtrl.noNext());
          pages.push(nextPage);
        }

        // Add first & last links
        if (boundaryLinks) {
          var firstPage = makePage(1, firstText, false, paginationCtrl.noPrevious());
          pages.unshift(firstPage);

          var lastPage = makePage(totalPages, lastText, false, paginationCtrl.noNext());
          pages.push(lastPage);
        }

        return pages;
      };
    }
  };
}])

.constant('pagerConfig', {
  itemsPerPage: 10,
  previousText: '« Previous',
  nextText: 'Next »',
  align: true
})

.directive('pager', ['pagerConfig', function(config) {
  return {
    restrict: 'EA',
    scope: {
      page: '=',
      totalItems: '=',
      onSelectPage:' &',
      numPages: '='
    },
    controller: 'PaginationController',
    templateUrl: 'template/pagination/pager.html',
    replace: true,
    link: function(scope, element, attrs, paginationCtrl) {

      // Setup configuration parameters
      var previousText = paginationCtrl.getAttributeValue(attrs.previousText, config.previousText, true),
      nextText         = paginationCtrl.getAttributeValue(attrs.nextText,     config.nextText,     true),
      align            = paginationCtrl.getAttributeValue(attrs.align,        config.align);

      paginationCtrl.init(config.itemsPerPage);

      // Create page object used in template
      function makePage(number, text, isDisabled, isPrevious, isNext) {
        return {
          number: number,
          text: text,
          disabled: isDisabled,
          previous: ( align && isPrevious ),
          next: ( align && isNext )
        };
      }

      paginationCtrl.getPages = function(currentPage) {
        return [
          makePage(currentPage - 1, previousText, paginationCtrl.noPrevious(), true, false),
          makePage(currentPage + 1, nextText, paginationCtrl.noNext(), false, true)
        ];
      };
    }
  };
}]);

/**
 * The following features are still outstanding: animation as a
 * function, placement as a function, inside, support for more triggers than
 * just mouse enter/leave, html tooltips, and selector delegation.
 */
angular.module( 'ui.bootstrap.tooltip', [ 'ui.bootstrap.position', 'ui.bootstrap.bindHtml' ] )

/**
 * The $tooltip service creates tooltip- and popover-like directives as well as
 * houses global options for them.
 */
.provider( '$tooltip', function () {
  // The default options tooltip and popover.
  var defaultOptions = {
    placement: 'top',
    animation: true,
    popupDelay: 0
  };

  // Default hide triggers for each show trigger
  var triggerMap = {
    'mouseenter': 'mouseleave',
    'click': 'click',
    'focus': 'blur'
  };

  // The options specified to the provider globally.
  var globalOptions = {};
  
  /**
   * `options({})` allows global configuration of all tooltips in the
   * application.
   *
   *   var app = angular.module( 'App', ['ui.bootstrap.tooltip'], function( $tooltipProvider ) {
   *     // place tooltips left instead of top by default
   *     $tooltipProvider.options( { placement: 'left' } );
   *   });
   */
	this.options = function( value ) {
		angular.extend( globalOptions, value );
	};

  /**
   * This allows you to extend the set of trigger mappings available. E.g.:
   *
   *   $tooltipProvider.setTriggers( 'openTrigger': 'closeTrigger' );
   */
  this.setTriggers = function setTriggers ( triggers ) {
    angular.extend( triggerMap, triggers );
  };

  /**
   * This is a helper function for translating camel-case to snake-case.
   */
  function snake_case(name){
    var regexp = /[A-Z]/g;
    var separator = '-';
    return name.replace(regexp, function(letter, pos) {
      return (pos ? separator : '') + letter.toLowerCase();
    });
  }

  /**
   * Returns the actual instance of the $tooltip service.
   * TODO support multiple triggers
   */
  this.$get = [ '$window', '$compile', '$timeout', '$parse', '$document', '$position', '$interpolate', function ( $window, $compile, $timeout, $parse, $document, $position, $interpolate ) {
    return function $tooltip ( type, prefix, defaultTriggerShow ) {
      var options = angular.extend( {}, defaultOptions, globalOptions );

      /**
       * Returns an object of show and hide triggers.
       *
       * If a trigger is supplied,
       * it is used to show the tooltip; otherwise, it will use the `trigger`
       * option passed to the `$tooltipProvider.options` method; else it will
       * default to the trigger supplied to this directive factory.
       *
       * The hide trigger is based on the show trigger. If the `trigger` option
       * was passed to the `$tooltipProvider.options` method, it will use the
       * mapped trigger from `triggerMap` or the passed trigger if the map is
       * undefined; otherwise, it uses the `triggerMap` value of the show
       * trigger; else it will just use the show trigger.
       */
      function getTriggers ( trigger ) {
        var show = trigger || options.trigger || defaultTriggerShow;
        var hide = triggerMap[show] || show;
        return {
          show: show,
          hide: hide
        };
      }

      var directiveName = snake_case( type );

      var startSym = $interpolate.startSymbol();
      var endSym = $interpolate.endSymbol();
      var template = 
        '<'+ directiveName +'-popup '+
          'title="'+startSym+'tt_title'+endSym+'" '+
          'content="'+startSym+'tt_content'+endSym+'" '+
          'placement="'+startSym+'tt_placement'+endSym+'" '+
          'animation="tt_animation()" '+
          'is-open="tt_isOpen"'+
          '>'+
        '</'+ directiveName +'-popup>';

      return {
        restrict: 'EA',
        scope: true,
        link: function link ( scope, element, attrs ) {
          var tooltip = $compile( template )( scope );
          var transitionTimeout;
          var popupTimeout;
          var $body;
          var appendToBody = angular.isDefined( options.appendToBody ) ? options.appendToBody : false;
          var triggers = getTriggers( undefined );
          var hasRegisteredTriggers = false;

          // By default, the tooltip is not open.
          // TODO add ability to start tooltip opened
          scope.tt_isOpen = false;

          function toggleTooltipBind () {
            if ( ! scope.tt_isOpen ) {
              showTooltipBind();
            } else {
              hideTooltipBind();
            }
          }
          
          // Show the tooltip with delay if specified, otherwise show it immediately
          function showTooltipBind() {
            if ( scope.tt_popupDelay ) {
              popupTimeout = $timeout( show, scope.tt_popupDelay );
            } else {
              scope.$apply( show );
            }
          }

          function hideTooltipBind () {
            scope.$apply(function () {
              hide();
            });
          }
          
          // Show the tooltip popup element.
          function show() {
            var position,
                ttWidth,
                ttHeight,
                ttPosition;

            // Don't show empty tooltips.
            if ( ! scope.tt_content ) {
              return;
            }

            // If there is a pending remove transition, we must cancel it, lest the
            // tooltip be mysteriously removed.
            if ( transitionTimeout ) {
              $timeout.cancel( transitionTimeout );
            }
            
            // Set the initial positioning.
            tooltip.css({ top: 0, left: 0, display: 'block' });
            
            // Now we add it to the DOM because need some info about it. But it's not 
            // visible yet anyway.
            if ( appendToBody ) {
                $body = $body || $document.find( 'body' );
                $body.append( tooltip );
            } else {
              element.after( tooltip );
            }

            // Get the position of the directive element.
            position = appendToBody ? $position.offset( element ) : $position.position( element );

            // Get the height and width of the tooltip so we can center it.
            ttWidth = tooltip.prop( 'offsetWidth' );
            ttHeight = tooltip.prop( 'offsetHeight' );
            
            // Calculate the tooltip's top and left coordinates to center it with
            // this directive.
            switch ( scope.tt_placement ) {
              case 'right':
                ttPosition = {
                  top: position.top + position.height / 2 - ttHeight / 2,
                  left: position.left + position.width
                };
                break;
              case 'bottom':
                ttPosition = {
                  top: position.top + position.height,
                  left: position.left + position.width / 2 - ttWidth / 2
                };
                break;
              case 'left':
                ttPosition = {
                  top: position.top + position.height / 2 - ttHeight / 2,
                  left: position.left - ttWidth
                };
                break;
              default:
                ttPosition = {
                  top: position.top - ttHeight,
                  left: position.left + position.width / 2 - ttWidth / 2
                };
                break;
            }

            ttPosition.top += 'px';
            ttPosition.left += 'px';

            // Now set the calculated positioning.
            tooltip.css( ttPosition );
              
            // And show the tooltip.
            scope.tt_isOpen = true;
          }
          
          // Hide the tooltip popup element.
          function hide() {
            // First things first: we don't show it anymore.
            scope.tt_isOpen = false;

            //if tooltip is going to be shown after delay, we must cancel this
            $timeout.cancel( popupTimeout );
            
            // And now we remove it from the DOM. However, if we have animation, we 
            // need to wait for it to expire beforehand.
            // FIXME: this is a placeholder for a port of the transitions library.
            if ( angular.isDefined( scope.tt_animation ) && scope.tt_animation() ) {
              transitionTimeout = $timeout( function () { tooltip.remove(); }, 500 );
            } else {
              tooltip.remove();
            }
          }

          /**
           * Observe the relevant attributes.
           */
          attrs.$observe( type, function ( val ) {
            scope.tt_content = val;
          });

          attrs.$observe( prefix+'Title', function ( val ) {
            scope.tt_title = val;
          });

          attrs.$observe( prefix+'Placement', function ( val ) {
            scope.tt_placement = angular.isDefined( val ) ? val : options.placement;
          });

          attrs.$observe( prefix+'Animation', function ( val ) {
            scope.tt_animation = angular.isDefined( val ) ? $parse( val ) : function(){ return options.animation; };
          });

          attrs.$observe( prefix+'PopupDelay', function ( val ) {
            var delay = parseInt( val, 10 );
            scope.tt_popupDelay = ! isNaN(delay) ? delay : options.popupDelay;
          });

          attrs.$observe( prefix+'Trigger', function ( val ) {

            if (hasRegisteredTriggers) {
              element.unbind( triggers.show, showTooltipBind );
              element.unbind( triggers.hide, hideTooltipBind );
            }

            triggers = getTriggers( val );

            if ( triggers.show === triggers.hide ) {
              element.bind( triggers.show, toggleTooltipBind );
            } else {
              element.bind( triggers.show, showTooltipBind );
              element.bind( triggers.hide, hideTooltipBind );
            }

            hasRegisteredTriggers = true;
          });

          attrs.$observe( prefix+'AppendToBody', function ( val ) {
            appendToBody = angular.isDefined( val ) ? $parse( val )( scope ) : appendToBody;
          });

          // if a tooltip is attached to <body> we need to remove it on
          // location change as its parent scope will probably not be destroyed
          // by the change.
          if ( appendToBody ) {
            scope.$on('$locationChangeSuccess', function closeTooltipOnLocationChangeSuccess () {
            if ( scope.tt_isOpen ) {
              hide();
            }
          });
          }

          // Make sure tooltip is destroyed and removed.
          scope.$on('$destroy', function onDestroyTooltip() {
            if ( scope.tt_isOpen ) {
              hide();
            } else {
              tooltip.remove();
            }
          });
        }
      };
    };
  }];
})

.directive( 'tooltipPopup', function () {
  return {
    restrict: 'E',
    replace: true,
    scope: { content: '@', placement: '@', animation: '&', isOpen: '&' },
    templateUrl: 'template/tooltip/tooltip-popup.html'
  };
})

.directive( 'tooltip', [ '$tooltip', function ( $tooltip ) {
  return $tooltip( 'tooltip', 'tooltip', 'mouseenter' );
}])

.directive( 'tooltipHtmlUnsafePopup', function () {
  return {
    restrict: 'E',
    replace: true,
    scope: { content: '@', placement: '@', animation: '&', isOpen: '&' },
    templateUrl: 'template/tooltip/tooltip-html-unsafe-popup.html'
  };
})

.directive( 'tooltipHtmlUnsafe', [ '$tooltip', function ( $tooltip ) {
  return $tooltip( 'tooltipHtmlUnsafe', 'tooltip', 'mouseenter' );
}]);

/**
 * The following features are still outstanding: popup delay, animation as a
 * function, placement as a function, inside, support for more triggers than
 * just mouse enter/leave, html popovers, and selector delegatation.
 */
angular.module( 'ui.bootstrap.popover', [ 'ui.bootstrap.tooltip' ] )
.directive( 'popoverPopup', function () {
  return {
    restrict: 'EA',
    replace: true,
    scope: { title: '@', content: '@', placement: '@', animation: '&', isOpen: '&' },
    templateUrl: 'template/popover/popover.html'
  };
})
.directive( 'popover', [ '$compile', '$timeout', '$parse', '$window', '$tooltip', function ( $compile, $timeout, $parse, $window, $tooltip ) {
  return $tooltip( 'popover', 'popover', 'click' );
}]);


angular.module('ui.bootstrap.progressbar', ['ui.bootstrap.transition'])

.constant('progressConfig', {
  animate: true,
  autoType: false,
  stackedTypes: ['success', 'info', 'warning', 'danger']
})

.controller('ProgressBarController', ['$scope', '$attrs', 'progressConfig', function($scope, $attrs, progressConfig) {

    // Whether bar transitions should be animated
    var animate = angular.isDefined($attrs.animate) ? $scope.$eval($attrs.animate) : progressConfig.animate;
    var autoType = angular.isDefined($attrs.autoType) ? $scope.$eval($attrs.autoType) : progressConfig.autoType;
    var stackedTypes = angular.isDefined($attrs.stackedTypes) ? $scope.$eval('[' + $attrs.stackedTypes + ']') : progressConfig.stackedTypes;

    // Create bar object
    this.makeBar = function(newBar, oldBar, index) {
        var newValue = (angular.isObject(newBar)) ? newBar.value : (newBar || 0);
        var oldValue =  (angular.isObject(oldBar)) ? oldBar.value : (oldBar || 0);
        var type = (angular.isObject(newBar) && angular.isDefined(newBar.type)) ? newBar.type : (autoType) ? getStackedType(index || 0) : null;

        return {
            from: oldValue,
            to: newValue,
            type: type,
            animate: animate
        };
    };

    function getStackedType(index) {
        return stackedTypes[index];
    }

    this.addBar = function(bar) {
        $scope.bars.push(bar);
        $scope.totalPercent += bar.to;
    };

    this.clearBars = function() {
        $scope.bars = [];
        $scope.totalPercent = 0;
    };
    this.clearBars();
}])

.directive('progress', function() {
    return {
        restrict: 'EA',
        replace: true,
        controller: 'ProgressBarController',
        scope: {
            value: '=percent',
            onFull: '&',
            onEmpty: '&'
        },
        templateUrl: 'template/progressbar/progress.html',
        link: function(scope, element, attrs, controller) {
            scope.$watch('value', function(newValue, oldValue) {
                controller.clearBars();

                if (angular.isArray(newValue)) {
                    // Stacked progress bar
                    for (var i=0, n=newValue.length; i < n; i++) {
                        controller.addBar(controller.makeBar(newValue[i], oldValue[i], i));
                    }
                } else {
                    // Simple bar
                    controller.addBar(controller.makeBar(newValue, oldValue));
                }
            }, true);

            // Total percent listeners
            scope.$watch('totalPercent', function(value) {
              if (value >= 100) {
                scope.onFull();
              } else if (value <= 0) {
                scope.onEmpty();
              }
            }, true);
        }
    };
})

.directive('progressbar', ['$transition', function($transition) {
    return {
        restrict: 'EA',
        replace: true,
        scope: {
            width: '=',
            old: '=',
            type: '=',
            animate: '='
        },
        templateUrl: 'template/progressbar/bar.html',
        link: function(scope, element) {
            scope.$watch('width', function(value) {
                if (scope.animate) {
                    element.css('width', scope.old + '%');
                    $transition(element, {width: value + '%'});
                } else {
                    element.css('width', value + '%');
                }
            });
        }
    };
}]);
angular.module('ui.bootstrap.rating', [])

.constant('ratingConfig', {
  max: 5,
  stateOn: null,
  stateOff: null
})

.controller('RatingController', ['$scope', '$attrs', '$parse', 'ratingConfig', function($scope, $attrs, $parse, ratingConfig) {

  this.maxRange = angular.isDefined($attrs.max) ? $scope.$parent.$eval($attrs.max) : ratingConfig.max;
  this.stateOn = angular.isDefined($attrs.stateOn) ? $scope.$parent.$eval($attrs.stateOn) : ratingConfig.stateOn;
  this.stateOff = angular.isDefined($attrs.stateOff) ? $scope.$parent.$eval($attrs.stateOff) : ratingConfig.stateOff;

  this.createDefaultRange = function(len) {
    var defaultStateObject = {
      stateOn: this.stateOn,
      stateOff: this.stateOff
    };

    var states = new Array(len);
    for (var i = 0; i < len; i++) {
      states[i] = defaultStateObject;
    }
    return states;
  };

  this.normalizeRange = function(states) {
    for (var i = 0, n = states.length; i < n; i++) {
      states[i].stateOn = states[i].stateOn || this.stateOn;
      states[i].stateOff = states[i].stateOff || this.stateOff;
    }
    return states;
  };

  // Get objects used in template
  $scope.range = angular.isDefined($attrs.ratingStates) ?  this.normalizeRange(angular.copy($scope.$parent.$eval($attrs.ratingStates))): this.createDefaultRange(this.maxRange);

  $scope.rate = function(value) {
    if ( $scope.readonly || $scope.value === value) {
      return;
    }

    $scope.value = value;
  };

  $scope.enter = function(value) {
    if ( ! $scope.readonly ) {
      $scope.val = value;
    }
    $scope.onHover({value: value});
  };

  $scope.reset = function() {
    $scope.val = angular.copy($scope.value);
    $scope.onLeave();
  };

  $scope.$watch('value', function(value) {
    $scope.val = value;
  });

  $scope.readonly = false;
  if ($attrs.readonly) {
    $scope.$parent.$watch($parse($attrs.readonly), function(value) {
      $scope.readonly = !!value;
    });
  }
}])

.directive('rating', function() {
  return {
    restrict: 'EA',
    scope: {
      value: '=',
      onHover: '&',
      onLeave: '&'
    },
    controller: 'RatingController',
    templateUrl: 'template/rating/rating.html',
    replace: true
  };
});

/**
 * @ngdoc overview
 * @name ui.bootstrap.tabs
 *
 * @description
 * AngularJS version of the tabs directive.
 */

angular.module('ui.bootstrap.tabs', [])

.directive('tabs', function() {
  return function() {
    throw new Error("The `tabs` directive is deprecated, please migrate to `tabset`. Instructions can be found at http://github.com/angular-ui/bootstrap/tree/master/CHANGELOG.md");
  };
})

.controller('TabsetController', ['$scope', '$element',
function TabsetCtrl($scope, $element) {

  var ctrl = this,
    tabs = ctrl.tabs = $scope.tabs = [];

  ctrl.select = function(tab) {
    angular.forEach(tabs, function(tab) {
      tab.active = false;
    });
    tab.active = true;
  };

  ctrl.addTab = function addTab(tab) {
    tabs.push(tab);
    if (tabs.length === 1 || tab.active) {
      ctrl.select(tab);
    }
  };

  ctrl.removeTab = function removeTab(tab) {
    var index = tabs.indexOf(tab);
    //Select a new tab if the tab to be removed is selected
    if (tab.active && tabs.length > 1) {
      //If this is the last tab, select the previous tab. else, the next tab.
      var newActiveIndex = index == tabs.length - 1 ? index - 1 : index + 1;
      ctrl.select(tabs[newActiveIndex]);
    }
    tabs.splice(index, 1);
  };
}])

/**
 * @ngdoc directive
 * @name ui.bootstrap.tabs.directive:tabset
 * @restrict EA
 *
 * @description
 * Tabset is the outer container for the tabs directive
 *
 * @param {boolean=} vertical Whether or not to use vertical styling for the tabs.
 * @param {string=} direction  What direction the tabs should be rendered. Available:
 * 'right', 'left', 'below'.
 *
 * @example
<example module="ui.bootstrap">
  <file name="index.html">
    <tabset>
      <tab heading="Vertical Tab 1"><b>First</b> Content!</tab>
      <tab heading="Vertical Tab 2"><i>Second</i> Content!</tab>
    </tabset>
    <hr />
    <tabset vertical="true">
      <tab heading="Vertical Tab 1"><b>First</b> Vertical Content!</tab>
      <tab heading="Vertical Tab 2"><i>Second</i> Vertical Content!</tab>
    </tabset>
  </file>
</example>
 */
.directive('tabset', function() {
  return {
    restrict: 'EA',
    transclude: true,
    replace: true,
    require: '^tabset',
    scope: {},
    controller: 'TabsetController',
    templateUrl: 'template/tabs/tabset.html',
    compile: function(elm, attrs, transclude) {
      return function(scope, element, attrs, tabsetCtrl) {
        scope.vertical = angular.isDefined(attrs.vertical) ? scope.$parent.$eval(attrs.vertical) : false;
        scope.type = angular.isDefined(attrs.type) ? scope.$parent.$eval(attrs.type) : 'tabs';
        scope.direction = angular.isDefined(attrs.direction) ? scope.$parent.$eval(attrs.direction) : 'top';
        scope.tabsAbove = (scope.direction != 'below');
        tabsetCtrl.$scope = scope;
        tabsetCtrl.$transcludeFn = transclude;
      };
    }
  };
})

/**
 * @ngdoc directive
 * @name ui.bootstrap.tabs.directive:tab
 * @restrict EA
 *
 * @param {string=} heading The visible heading, or title, of the tab. Set HTML headings with {@link ui.bootstrap.tabs.directive:tabHeading tabHeading}.
 * @param {string=} select An expression to evaluate when the tab is selected.
 * @param {boolean=} active A binding, telling whether or not this tab is selected.
 * @param {boolean=} disabled A binding, telling whether or not this tab is disabled.
 *
 * @description
 * Creates a tab with a heading and content. Must be placed within a {@link ui.bootstrap.tabs.directive:tabset tabset}.
 *
 * @example
<example module="ui.bootstrap">
  <file name="index.html">
    <div ng-controller="TabsDemoCtrl">
      <button class="btn btn-small" ng-click="items[0].active = true">
        Select item 1, using active binding
      </button>
      <button class="btn btn-small" ng-click="items[1].disabled = !items[1].disabled">
        Enable/disable item 2, using disabled binding
      </button>
      <br />
      <tabset>
        <tab heading="Tab 1">First Tab</tab>
        <tab select="alertMe()">
          <tab-heading><i class="icon-bell"></i> Alert me!</tab-heading>
          Second Tab, with alert callback and html heading!
        </tab>
        <tab ng-repeat="item in items"
          heading="{{item.title}}"
          disabled="item.disabled"
          active="item.active">
          {{item.content}}
        </tab>
      </tabset>
    </div>
  </file>
  <file name="script.js">
    function TabsDemoCtrl($scope) {
      $scope.items = [
        { title:"Dynamic Title 1", content:"Dynamic Item 0" },
        { title:"Dynamic Title 2", content:"Dynamic Item 1", disabled: true }
      ];

      $scope.alertMe = function() {
        setTimeout(function() {
          alert("You've selected the alert tab!");
        });
      };
    };
  </file>
</example>
 */

/**
 * @ngdoc directive
 * @name ui.bootstrap.tabs.directive:tabHeading
 * @restrict EA
 *
 * @description
 * Creates an HTML heading for a {@link ui.bootstrap.tabs.directive:tab tab}. Must be placed as a child of a tab element.
 *
 * @example
<example module="ui.bootstrap">
  <file name="index.html">
    <tabset>
      <tab>
        <tab-heading><b>HTML</b> in my titles?!</tab-heading>
        And some content, too!
      </tab>
      <tab>
        <tab-heading><i class="icon-heart"></i> Icon heading?!?</tab-heading>
        That's right.
      </tab>
    </tabset>
  </file>
</example>
 */
.directive('tab', ['$parse', '$http', '$templateCache', '$compile',
function($parse, $http, $templateCache, $compile) {
  return {
    require: '^tabset',
    restrict: 'EA',
    replace: true,
    templateUrl: 'template/tabs/tab.html',
    transclude: true,
    scope: {
      heading: '@',
      onSelect: '&select', //This callback is called in contentHeadingTransclude
                          //once it inserts the tab's content into the dom
      onDeselect: '&deselect'
    },
    controller: function() {
      //Empty controller so other directives can require being 'under' a tab
    },
    compile: function(elm, attrs, transclude) {
      return function postLink(scope, elm, attrs, tabsetCtrl) {
        var getActive, setActive;
        if (attrs.active) {
          getActive = $parse(attrs.active);
          setActive = getActive.assign;
          scope.$parent.$watch(getActive, function updateActive(value) {
            scope.active = !!value;
          });
          scope.active = getActive(scope.$parent);
        } else {
          setActive = getActive = angular.noop;
        }

        scope.$watch('active', function(active) {
          setActive(scope.$parent, active);
          if (active) {
            tabsetCtrl.select(scope);
            scope.onSelect();
          } else {
            scope.onDeselect();
          }
        });

        scope.disabled = false;
        if ( attrs.disabled ) {
          scope.$parent.$watch($parse(attrs.disabled), function(value) {
            scope.disabled = !! value;
          });
        }

        scope.select = function() {
          if ( ! scope.disabled ) {
            scope.active = true;
          }
        };

        tabsetCtrl.addTab(scope);
        scope.$on('$destroy', function() {
          tabsetCtrl.removeTab(scope);
        });
        if (scope.active) {
          setActive(scope.$parent, true);
        }


        //We need to transclude later, once the content container is ready.
        //when this link happens, we're inside a tab heading.
        scope.$transcludeFn = transclude;
      };
    }
  };
}])

.directive('tabHeadingTransclude', [function() {
  return {
    restrict: 'A',
    require: '^tab',
    link: function(scope, elm, attrs, tabCtrl) {
      scope.$watch('headingElement', function updateHeadingElement(heading) {
        if (heading) {
          elm.html('');
          elm.append(heading);
        }
      });
    }
  };
}])

.directive('tabContentTransclude', ['$compile', '$parse', function($compile, $parse) {
  return {
    restrict: 'A',
    require: '^tabset',
    link: function(scope, elm, attrs) {
      var tab = scope.$eval(attrs.tabContentTransclude);

      //Now our tab is ready to be transcluded: both the tab heading area
      //and the tab content area are loaded.  Transclude 'em both.
      tab.$transcludeFn(tab.$parent, function(contents) {
        angular.forEach(contents, function(node) {
          if (isTabHeading(node)) {
            //Let tabHeadingTransclude know.
            tab.headingElement = node;
          } else {
            elm.append(node);
          }
        });
      });
    }
  };
  function isTabHeading(node) {
    return node.tagName &&  (
      node.hasAttribute('tab-heading') ||
      node.hasAttribute('data-tab-heading') ||
      node.tagName.toLowerCase() === 'tab-heading' ||
      node.tagName.toLowerCase() === 'data-tab-heading'
    );
  }
}])

.directive('tabsetTitles', ['$http', function($http) {
  return {
    restrict: 'A',
    require: '^tabset',
    templateUrl: 'template/tabs/tabset-titles.html',
    replace: true,
    link: function(scope, elm, attrs, tabsetCtrl) {
      if (!scope.$eval(attrs.tabsetTitles)) {
        elm.remove();
      } else {
        //now that tabs location has been decided, transclude the tab titles in
        tabsetCtrl.$transcludeFn(tabsetCtrl.$scope.$parent, function(node) {
          elm.append(node);
        });
      }
    }
  };
}])

;


angular.module('ui.bootstrap.timepicker', [])

.constant('timepickerConfig', {
  hourStep: 1,
  minuteStep: 1,
  showMeridian: true,
  meridians: ['AM', 'PM'],
  readonlyInput: false,
  mousewheel: true
})

.directive('timepicker', ['$parse', '$log', 'timepickerConfig', function ($parse, $log, timepickerConfig) {
  return {
    restrict: 'EA',
    require:'?^ngModel',
    replace: true,
    scope: {},
    templateUrl: 'template/timepicker/timepicker.html',
    link: function(scope, element, attrs, ngModel) {
      if ( !ngModel ) {
        return; // do nothing if no ng-model
      }

      var selected = new Date(), meridians = timepickerConfig.meridians;

      var hourStep = timepickerConfig.hourStep;
      if (attrs.hourStep) {
        scope.$parent.$watch($parse(attrs.hourStep), function(value) {
          hourStep = parseInt(value, 10);
        });
      }

      var minuteStep = timepickerConfig.minuteStep;
      if (attrs.minuteStep) {
        scope.$parent.$watch($parse(attrs.minuteStep), function(value) {
          minuteStep = parseInt(value, 10);
        });
      }

      // 12H / 24H mode
      scope.showMeridian = timepickerConfig.showMeridian;
      if (attrs.showMeridian) {
        scope.$parent.$watch($parse(attrs.showMeridian), function(value) {
          scope.showMeridian = !!value;

          if ( ngModel.$error.time ) {
            // Evaluate from template
            var hours = getHoursFromTemplate(), minutes = getMinutesFromTemplate();
            if (angular.isDefined( hours ) && angular.isDefined( minutes )) {
              selected.setHours( hours );
              refresh();
            }
          } else {
            updateTemplate();
          }
        });
      }

      // Get scope.hours in 24H mode if valid
      function getHoursFromTemplate ( ) {
        var hours = parseInt( scope.hours, 10 );
        var valid = ( scope.showMeridian ) ? (hours > 0 && hours < 13) : (hours >= 0 && hours < 24);
        if ( !valid ) {
          return undefined;
        }

        if ( scope.showMeridian ) {
          if ( hours === 12 ) {
            hours = 0;
          }
          if ( scope.meridian === meridians[1] ) {
            hours = hours + 12;
          }
        }
        return hours;
      }

      function getMinutesFromTemplate() {
        var minutes = parseInt(scope.minutes, 10);
        return ( minutes >= 0 && minutes < 60 ) ? minutes : undefined;
      }

      function pad( value ) {
        return ( angular.isDefined(value) && value.toString().length < 2 ) ? '0' + value : value;
      }

      // Input elements
      var inputs = element.find('input'), hoursInputEl = inputs.eq(0), minutesInputEl = inputs.eq(1);

      // Respond on mousewheel spin
      var mousewheel = (angular.isDefined(attrs.mousewheel)) ? scope.$eval(attrs.mousewheel) : timepickerConfig.mousewheel;
      if ( mousewheel ) {

        var isScrollingUp = function(e) {
          if (e.originalEvent) {
            e = e.originalEvent;
          }
          //pick correct delta variable depending on event
          var delta = (e.wheelDelta) ? e.wheelDelta : -e.deltaY;
          return (e.detail || delta > 0);
        };

        hoursInputEl.bind('mousewheel wheel', function(e) {
          scope.$apply( (isScrollingUp(e)) ? scope.incrementHours() : scope.decrementHours() );
          e.preventDefault();
        });

        minutesInputEl.bind('mousewheel wheel', function(e) {
          scope.$apply( (isScrollingUp(e)) ? scope.incrementMinutes() : scope.decrementMinutes() );
          e.preventDefault();
        });
      }

      scope.readonlyInput = (angular.isDefined(attrs.readonlyInput)) ? scope.$eval(attrs.readonlyInput) : timepickerConfig.readonlyInput;
      if ( ! scope.readonlyInput ) {

        var invalidate = function(invalidHours, invalidMinutes) {
          ngModel.$setViewValue( null );
          ngModel.$setValidity('time', false);
          if (angular.isDefined(invalidHours)) {
            scope.invalidHours = invalidHours;
          }
          if (angular.isDefined(invalidMinutes)) {
            scope.invalidMinutes = invalidMinutes;
          }
        };

        scope.updateHours = function() {
          var hours = getHoursFromTemplate();

          if ( angular.isDefined(hours) ) {
            selected.setHours( hours );
            refresh( 'h' );
          } else {
            invalidate(true);
          }
        };

        hoursInputEl.bind('blur', function(e) {
          if ( !scope.validHours && scope.hours < 10) {
            scope.$apply( function() {
              scope.hours = pad( scope.hours );
            });
          }
        });

        scope.updateMinutes = function() {
          var minutes = getMinutesFromTemplate();

          if ( angular.isDefined(minutes) ) {
            selected.setMinutes( minutes );
            refresh( 'm' );
          } else {
            invalidate(undefined, true);
          }
        };

        minutesInputEl.bind('blur', function(e) {
          if ( !scope.invalidMinutes && scope.minutes < 10 ) {
            scope.$apply( function() {
              scope.minutes = pad( scope.minutes );
            });
          }
        });
      } else {
        scope.updateHours = angular.noop;
        scope.updateMinutes = angular.noop;
      }

      ngModel.$render = function() {
        var date = ngModel.$modelValue ? new Date( ngModel.$modelValue ) : null;

        if ( isNaN(date) ) {
          ngModel.$setValidity('time', false);
          $log.error('Timepicker directive: "ng-model" value must be a Date object, a number of milliseconds since 01.01.1970 or a string representing an RFC2822 or ISO 8601 date.');
        } else {
          if ( date ) {
            selected = date;
          }
          makeValid();
          updateTemplate();
        }
      };

      // Call internally when we know that model is valid.
      function refresh( keyboardChange ) {
        makeValid();
        ngModel.$setViewValue( new Date(selected) );
        updateTemplate( keyboardChange );
      }

      function makeValid() {
        ngModel.$setValidity('time', true);
        scope.invalidHours = false;
        scope.invalidMinutes = false;
      }

      function updateTemplate( keyboardChange ) {
        var hours = selected.getHours(), minutes = selected.getMinutes();

        if ( scope.showMeridian ) {
          hours = ( hours === 0 || hours === 12 ) ? 12 : hours % 12; // Convert 24 to 12 hour system
        }
        scope.hours =  keyboardChange === 'h' ? hours : pad(hours);
        scope.minutes = keyboardChange === 'm' ? minutes : pad(minutes);
        scope.meridian = selected.getHours() < 12 ? meridians[0] : meridians[1];
      }

      function addMinutes( minutes ) {
        var dt = new Date( selected.getTime() + minutes * 60000 );
        selected.setHours( dt.getHours(), dt.getMinutes() );
        refresh();
      }

      scope.incrementHours = function() {
        addMinutes( hourStep * 60 );
      };
      scope.decrementHours = function() {
        addMinutes( - hourStep * 60 );
      };
      scope.incrementMinutes = function() {
        addMinutes( minuteStep );
      };
      scope.decrementMinutes = function() {
        addMinutes( - minuteStep );
      };
      scope.toggleMeridian = function() {
        addMinutes( 12 * 60 * (( selected.getHours() < 12 ) ? 1 : -1) );
      };
    }
  };
}]);

angular.module('ui.bootstrap.typeahead', ['ui.bootstrap.position', 'ui.bootstrap.bindHtml'])

/**
 * A helper service that can parse typeahead's syntax (string provided by users)
 * Extracted to a separate service for ease of unit testing
 */
  .factory('typeaheadParser', ['$parse', function ($parse) {

  //                      00000111000000000000022200000000000000003333333333333330000000000044000
  var TYPEAHEAD_REGEXP = /^\s*(.*?)(?:\s+as\s+(.*?))?\s+for\s+(?:([\$\w][\$\w\d]*))\s+in\s+(.*)$/;

  return {
    parse:function (input) {

      var match = input.match(TYPEAHEAD_REGEXP), modelMapper, viewMapper, source;
      if (!match) {
        throw new Error(
          "Expected typeahead specification in form of '_modelValue_ (as _label_)? for _item_ in _collection_'" +
            " but got '" + input + "'.");
      }

      return {
        itemName:match[3],
        source:$parse(match[4]),
        viewMapper:$parse(match[2] || match[1]),
        modelMapper:$parse(match[1])
      };
    }
  };
}])

  .directive('typeahead', ['$compile', '$parse', '$q', '$timeout', '$document', '$position', 'typeaheadParser',
    function ($compile, $parse, $q, $timeout, $document, $position, typeaheadParser) {

  var HOT_KEYS = [9, 13, 27, 38, 40];

  return {
    require:'ngModel',
    link:function (originalScope, element, attrs, modelCtrl) {

      //SUPPORTED ATTRIBUTES (OPTIONS)

      //minimal no of characters that needs to be entered before typeahead kicks-in
      var minSearch = originalScope.$eval(attrs.typeaheadMinLength) || 1;

      //minimal wait time after last character typed before typehead kicks-in
      var waitTime = originalScope.$eval(attrs.typeaheadWaitMs) || 0;

      //should it restrict model values to the ones selected from the popup only?
      var isEditable = originalScope.$eval(attrs.typeaheadEditable) !== false;

      //binding to a variable that indicates if matches are being retrieved asynchronously
      var isLoadingSetter = $parse(attrs.typeaheadLoading).assign || angular.noop;

      //a callback executed when a match is selected
      var onSelectCallback = $parse(attrs.typeaheadOnSelect);

      var inputFormatter = attrs.typeaheadInputFormatter ? $parse(attrs.typeaheadInputFormatter) : undefined;

      //INTERNAL VARIABLES

      //model setter executed upon match selection
      var $setModelValue = $parse(attrs.ngModel).assign;

      //expressions used by typeahead
      var parserResult = typeaheadParser.parse(attrs.typeahead);


      //pop-up element used to display matches
      var popUpEl = angular.element('<typeahead-popup></typeahead-popup>');
      popUpEl.attr({
        matches: 'matches',
        active: 'activeIdx',
        select: 'select(activeIdx)',
        query: 'query',
        position: 'position'
      });
      //custom item template
      if (angular.isDefined(attrs.typeaheadTemplateUrl)) {
        popUpEl.attr('template-url', attrs.typeaheadTemplateUrl);
      }

      //create a child scope for the typeahead directive so we are not polluting original scope
      //with typeahead-specific data (matches, query etc.)
      var scope = originalScope.$new();
      originalScope.$on('$destroy', function(){
        scope.$destroy();
      });

      var resetMatches = function() {
        scope.matches = [];
        scope.activeIdx = -1;
      };

      var getMatchesAsync = function(inputValue) {

        var locals = {$viewValue: inputValue};
        isLoadingSetter(originalScope, true);
        $q.when(parserResult.source(scope, locals)).then(function(matches) {

          //it might happen that several async queries were in progress if a user were typing fast
          //but we are interested only in responses that correspond to the current view value
          if (inputValue === modelCtrl.$viewValue) {
            if (matches.length > 0) {

              scope.activeIdx = 0;
              scope.matches.length = 0;

              //transform labels
              for(var i=0; i<matches.length; i++) {
                locals[parserResult.itemName] = matches[i];
                scope.matches.push({
                  label: parserResult.viewMapper(scope, locals),
                  model: matches[i]
                });
              }

              scope.query = inputValue;
              //position pop-up with matches - we need to re-calculate its position each time we are opening a window
              //with matches as a pop-up might be absolute-positioned and position of an input might have changed on a page
              //due to other elements being rendered
              scope.position = $position.position(element);
              scope.position.top = scope.position.top + element.prop('offsetHeight');

            } else {
              resetMatches();
            }
            isLoadingSetter(originalScope, false);
          }
        }, function(){
          resetMatches();
          isLoadingSetter(originalScope, false);
        });
      };

      resetMatches();

      //we need to propagate user's query so we can higlight matches
      scope.query = undefined;

      //Declare the timeout promise var outside the function scope so that stacked calls can be cancelled later 
      var timeoutPromise;

      //plug into $parsers pipeline to open a typeahead on view changes initiated from DOM
      //$parsers kick-in on all the changes coming from the view as well as manually triggered by $setViewValue
      modelCtrl.$parsers.unshift(function (inputValue) {

        resetMatches();
        if (inputValue && inputValue.length >= minSearch) {
          if (waitTime > 0) {
            if (timeoutPromise) {
              $timeout.cancel(timeoutPromise);//cancel previous timeout
            }
            timeoutPromise = $timeout(function () {
              getMatchesAsync(inputValue);
            }, waitTime);
          } else {
            getMatchesAsync(inputValue);
          }
        }

        if (isEditable) {
          return inputValue;
        } else {
          modelCtrl.$setValidity('editable', false);
          return undefined;
        }
      });

      modelCtrl.$formatters.push(function (modelValue) {

        var candidateViewValue, emptyViewValue;
        var locals = {};

        if (inputFormatter) {

          locals['$model'] = modelValue;
          return inputFormatter(originalScope, locals);

        } else {

          //it might happen that we don't have enough info to properly render input value
          //we need to check for this situation and simply return model value if we can't apply custom formatting
          locals[parserResult.itemName] = modelValue;
          candidateViewValue = parserResult.viewMapper(originalScope, locals);
          locals[parserResult.itemName] = undefined;
          emptyViewValue = parserResult.viewMapper(originalScope, locals);

          return candidateViewValue!== emptyViewValue ? candidateViewValue : modelValue;
        }
      });

      scope.select = function (activeIdx) {
        //called from within the $digest() cycle
        var locals = {};
        var model, item;

        locals[parserResult.itemName] = item = scope.matches[activeIdx].model;
        model = parserResult.modelMapper(originalScope, locals);
        $setModelValue(originalScope, model);
        modelCtrl.$setValidity('editable', true);

        onSelectCallback(originalScope, {
          $item: item,
          $model: model,
          $label: parserResult.viewMapper(originalScope, locals)
        });

        resetMatches();

        //return focus to the input element if a mach was selected via a mouse click event
        element[0].focus();
      };

      //bind keyboard events: arrows up(38) / down(40), enter(13) and tab(9), esc(27)
      element.bind('keydown', function (evt) {

        //typeahead is open and an "interesting" key was pressed
        if (scope.matches.length === 0 || HOT_KEYS.indexOf(evt.which) === -1) {
          return;
        }

        evt.preventDefault();

        if (evt.which === 40) {
          scope.activeIdx = (scope.activeIdx + 1) % scope.matches.length;
          scope.$digest();

        } else if (evt.which === 38) {
          scope.activeIdx = (scope.activeIdx ? scope.activeIdx : scope.matches.length) - 1;
          scope.$digest();

        } else if (evt.which === 13 || evt.which === 9) {
          scope.$apply(function () {
            scope.select(scope.activeIdx);
          });

        } else if (evt.which === 27) {
          evt.stopPropagation();

          resetMatches();
          scope.$digest();
        }
      });

      // Keep reference to click handler to unbind it.
      var dismissClickHandler = function (evt) {
        if (element[0] !== evt.target) {
          resetMatches();
          scope.$digest();
        }
      };

      $document.bind('click', dismissClickHandler);

      originalScope.$on('$destroy', function(){
        $document.unbind('click', dismissClickHandler);
      });

      element.after($compile(popUpEl)(scope));
    }
  };

}])

  .directive('typeaheadPopup', function () {
    return {
      restrict:'E',
      scope:{
        matches:'=',
        query:'=',
        active:'=',
        position:'=',
        select:'&'
      },
      replace:true,
      templateUrl:'template/typeahead/typeahead-popup.html',
      link:function (scope, element, attrs) {

        scope.templateUrl = attrs.templateUrl;

        scope.isOpen = function () {
          return scope.matches.length > 0;
        };

        scope.isActive = function (matchIdx) {
          return scope.active == matchIdx;
        };

        scope.selectActive = function (matchIdx) {
          scope.active = matchIdx;
        };

        scope.selectMatch = function (activeIdx) {
          scope.select({activeIdx:activeIdx});
        };
      }
    };
  })

  .directive('typeaheadMatch', ['$http', '$templateCache', '$compile', '$parse', function ($http, $templateCache, $compile, $parse) {
    return {
      restrict:'E',
      scope:{
        index:'=',
        match:'=',
        query:'='
      },
      link:function (scope, element, attrs) {
        var tplUrl = $parse(attrs.templateUrl)(scope.$parent) || 'template/typeahead/typeahead-match.html';
        $http.get(tplUrl, {cache: $templateCache}).success(function(tplContent){
           element.replaceWith($compile(tplContent.trim())(scope));
        });
      }
    };
  }])

  .filter('typeaheadHighlight', function() {

    function escapeRegexp(queryToEscape) {
      return queryToEscape.replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1");
    }

    return function(matchItem, query) {
      return query ? matchItem.replace(new RegExp(escapeRegexp(query), 'gi'), '<strong>$&</strong>') : matchItem;
    };
  });
angular.module("template/accordion/accordion-group.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/accordion/accordion-group.html",
    "<div class=\"accordion-group\">\n" +
    "  <div class=\"accordion-heading\" ><a class=\"accordion-toggle\" ng-click=\"isOpen = !isOpen\" accordion-transclude=\"heading\">{{heading}}</a></div>\n" +
    "  <div class=\"accordion-body\" collapse=\"!isOpen\">\n" +
    "    <div class=\"accordion-inner\" ng-transclude></div>  </div>\n" +
    "</div>");
}]);

angular.module("template/accordion/accordion.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/accordion/accordion.html",
    "<div class=\"accordion\" ng-transclude></div>");
}]);

angular.module("template/alert/alert.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/alert/alert.html",
    "<div class='alert' ng-class='type && \"alert-\" + type'>\n" +
    "    <button ng-show='closeable' type='button' class='close' ng-click='close()'>&times;</button>\n" +
    "    <div ng-transclude></div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("template/carousel/carousel.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/carousel/carousel.html",
    "<div ng-mouseenter=\"pause()\" ng-mouseleave=\"play()\" class=\"carousel\">\n" +
    "    <ol class=\"carousel-indicators\" ng-show=\"slides().length > 1\">\n" +
    "        <li ng-repeat=\"slide in slides()\" ng-class=\"{active: isActive(slide)}\" ng-click=\"select(slide)\"></li>\n" +
    "    </ol>\n" +
    "    <div class=\"carousel-inner\" ng-transclude></div>\n" +
    "    <a ng-click=\"prev()\" class=\"carousel-control left\" ng-show=\"slides().length > 1\">&lsaquo;</a>\n" +
    "    <a ng-click=\"next()\" class=\"carousel-control right\" ng-show=\"slides().length > 1\">&rsaquo;</a>\n" +
    "</div>\n" +
    "");
}]);

angular.module("template/carousel/slide.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/carousel/slide.html",
    "<div ng-class=\"{\n" +
    "    'active': leaving || (active && !entering),\n" +
    "    'prev': (next || active) && direction=='prev',\n" +
    "    'next': (next || active) && direction=='next',\n" +
    "    'right': direction=='prev',\n" +
    "    'left': direction=='next'\n" +
    "  }\" class=\"item\" ng-transclude></div>\n" +
    "");
}]);

angular.module("template/datepicker/datepicker.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/datepicker/datepicker.html",
    "<table>\n" +
    "  <thead>\n" +
    "    <tr class=\"text-center\">\n" +
    "      <th><button type=\"button\" class=\"btn fa fa-chevron-left pull-left\" ng-click=\"move(-1)\"><i class=\"icon-chevron-left\"></i></button></th>\n" +
    "      <th colspan=\"{{rows[0].length - 2 + showWeekNumbers}}\"><button type=\"button\" class=\"btn btn-block\" ng-click=\"toggleMode()\"><strong>{{title}}</strong></button></th>\n" +
    "      <th><button type=\"button\" class=\"btn fa fa-chevron-right pull-right\" ng-click=\"move(1)\"><i class=\"icon-chevron-right\"></i></button></th>\n" +
    "    </tr>\n" +
    "    <tr class=\"text-center\" ng-show=\"labels.length > 0\">\n" +
    "      <th ng-show=\"showWeekNumbers\">#</th>\n" +
    "      <th ng-repeat=\"label in labels\">{{label}}</th>\n" +
    "    </tr>\n" +
    "  </thead>\n" +
    "  <tbody>\n" +
    "    <tr ng-repeat=\"row in rows\">\n" +
    "      <td ng-show=\"showWeekNumbers\" class=\"text-center\"><em>{{ getWeekNumber(row) }}</em></td>\n" +
    "      <td ng-repeat=\"dt in row\" class=\"text-center\">\n" +
    "        <button type=\"button\" style=\"width:100%;\" class=\"btn pull-right\" ng-class=\"{'btn-info': dt.selected}\" ng-click=\"select(dt.date)\" ng-disabled=\"dt.disabled\"><span ng-class=\"{muted: dt.secondary}\">{{dt.label}}</span></button>\n" +
    "      </td>\n" +
    "    </tr>\n" +
    "  </tbody>\n" +
    "</table>\n" +
    "");
}]);

angular.module("template/datepicker/popup.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/datepicker/popup.html",
    "<ul class=\"dropdown-menu\" ng-style=\"{display: (isOpen && 'block') || 'none', top: position.top+'px', left: position.left+'px'}\" class=\"dropdown-menu\">\n" +
    "	<li ng-transclude></li>\n" +
    "	<li class=\"divider\"></li>\n" +
    "	<li style=\"padding: 9px;\">\n" +
    "		<span class=\"btn-group\">\n" +
    "			<button class=\"btn btn-small btn-inverse\" ng-click=\"today()\">Today</button>\n" +
    "			<button class=\"btn btn-small btn-info\" ng-click=\"showWeeks = ! showWeeks\" ng-class=\"{active: showWeeks}\">Weeks</button>\n" +
    "			<button class=\"btn btn-small btn-danger\" ng-click=\"clear()\">Clear</button>\n" +
    "		</span>\n" +
    "		<button class=\"btn btn-small btn-success\" ng-click=\"isOpen = false\">Close</button>\n" +
    "	</li>\n" +
    "</ul>");
}]);

angular.module("template/modal/backdrop.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/modal/backdrop.html",
    "<div class=\"modal-backdrop fade\" ng-class=\"{in: animate}\" ng-style=\"{'z-index': 1040 + index*10}\" ng-click=\"close($event)\"></div>");
}]);

angular.module("template/modal/window.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/modal/window.html",
    "<div class=\"modal fade {{ windowClass }}\" ng-class=\"{in: animate}\" ng-style=\"{'z-index': 1050 + index*10}\" ng-transclude></div>");
}]);

angular.module("template/pagination/pager.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/pagination/pager.html",
    "<div class=\"pager\">\n" +
    "  <ul>\n" +
    "    <li ng-repeat=\"page in pages\" ng-class=\"{disabled: page.disabled, previous: page.previous, next: page.next}\"><a ng-click=\"selectPage(page.number)\">{{page.text}}</a></li>\n" +
    "  </ul>\n" +
    "</div>\n" +
    "");
}]);

angular.module("template/pagination/pagination.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/pagination/pagination.html",
    "<div class=\"pagination\"><ul>\n" +
    "  <li ng-repeat=\"page in pages\" ng-class=\"{active: page.active, disabled: page.disabled}\"><a ng-click=\"selectPage(page.number)\">{{page.text}}</a></li>\n" +
    "  </ul>\n" +
    "</div>\n" +
    "");
}]);

angular.module("template/tooltip/tooltip-html-unsafe-popup.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/tooltip/tooltip-html-unsafe-popup.html",
    "<div class=\"tooltip {{placement}}\" ng-class=\"{ in: isOpen(), fade: animation() }\">\n" +
    "  <div class=\"tooltip-arrow\"></div>\n" +
    "  <div class=\"tooltip-inner\" ng-bind-html-unsafe=\"content\"></div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("template/tooltip/tooltip-popup.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/tooltip/tooltip-popup.html",
    "<div class=\"tooltip {{placement}}\" ng-class=\"{ in: isOpen(), fade: animation() }\">\n" +
    "  <div class=\"tooltip-arrow\"></div>\n" +
    "  <div class=\"tooltip-inner\" ng-bind=\"content\"></div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("template/popover/popover.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/popover/popover.html",
    "<div class=\"popover {{placement}}\" ng-class=\"{ in: isOpen(), fade: animation() }\">\n" +
    "  <div class=\"arrow\"></div>\n" +
    "\n" +
    "  <div class=\"popover-inner\">\n" +
    "      <h3 class=\"popover-title\" ng-bind=\"title\" ng-show=\"title\"></h3>\n" +
    "      <div class=\"popover-content\" ng-bind=\"content\"></div>\n" +
    "  </div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("template/progressbar/bar.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/progressbar/bar.html",
    "<div class=\"bar\" ng-class='type && \"bar-\" + type'></div>");
}]);

angular.module("template/progressbar/progress.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/progressbar/progress.html",
    "<div class=\"progress\"><progressbar ng-repeat=\"bar in bars\" width=\"bar.to\" old=\"bar.from\" animate=\"bar.animate\" type=\"bar.type\"></progressbar></div>");
}]);

angular.module("template/rating/rating.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/rating/rating.html",
    "<span ng-mouseleave=\"reset()\">\n" +
    "	<i ng-repeat=\"r in range\" ng-mouseenter=\"enter($index + 1)\" ng-click=\"rate($index + 1)\" ng-class=\"$index < val && (r.stateOn || 'icon-star') || (r.stateOff || 'icon-star-empty')\"></i>\n" +
    "</span>");
}]);

angular.module("template/tabs/pane.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/tabs/pane.html",
    "<div class=\"tab-pane\" ng-class=\"{active: selected}\" ng-show=\"selected\" ng-transclude></div>\n" +
    "");
}]);

angular.module("template/tabs/tab.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/tabs/tab.html",
    "<li ng-class=\"{active: active, disabled: disabled}\">\n" +
    "  <a ng-click=\"select()\" tab-heading-transclude>{{heading}}</a>\n" +
    "</li>\n" +
    "");
}]);

angular.module("template/tabs/tabs.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/tabs/tabs.html",
    "<div class=\"tabbable\">\n" +
    "  <ul class=\"nav nav-tabs\">\n" +
    "    <li ng-repeat=\"pane in panes\" ng-class=\"{active:pane.selected}\">\n" +
    "      <a ng-click=\"select(pane)\">{{pane.heading}}</a>\n" +
    "    </li>\n" +
    "  </ul>\n" +
    "  <div class=\"tab-content\" ng-transclude></div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("template/tabs/tabset-titles.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/tabs/tabset-titles.html",
    "<ul class=\"nav {{type && 'nav-' + type}}\" ng-class=\"{'nav-stacked': vertical}\">\n" +
    "</ul>\n" +
    "");
}]);

angular.module("template/tabs/tabset.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/tabs/tabset.html",
    "\n" +
    "<div class=\"tabbable\" ng-class=\"{'tabs-right': direction == 'right', 'tabs-left': direction == 'left', 'tabs-below': direction == 'below'}\">\n" +
    "  <div tabset-titles=\"tabsAbove\"></div>\n" +
    "  <div class=\"tab-content\">\n" +
    "    <div class=\"tab-pane\" \n" +
    "         ng-repeat=\"tab in tabs\" \n" +
    "         ng-class=\"{active: tab.active}\"\n" +
    "         tab-content-transclude=\"tab\">\n" +
    "    </div>\n" +
    "  </div>\n" +
    "  <div tabset-titles=\"!tabsAbove\"></div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("template/timepicker/timepicker.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/timepicker/timepicker.html",
    "<table class=\"form-inline\">\n" +
    "	<tr class=\"text-center\">\n" +
    "		<td><a ng-click=\"incrementHours()\" class=\"btn btn-link\"><i class=\"icon-chevron-up\"></i></a></td>\n" +
    "		<td>&nbsp;</td>\n" +
    "		<td><a ng-click=\"incrementMinutes()\" class=\"btn btn-link\"><i class=\"icon-chevron-up\"></i></a></td>\n" +
    "		<td ng-show=\"showMeridian\"></td>\n" +
    "	</tr>\n" +
    "	<tr>\n" +
    "		<td class=\"control-group\" ng-class=\"{'error': invalidHours}\"><input type=\"text\" ng-model=\"hours\" ng-change=\"updateHours()\" class=\"span1 text-center\" ng-mousewheel=\"incrementHours()\" ng-readonly=\"readonlyInput\" maxlength=\"2\" /></td>\n" +
    "		<td>:</td>\n" +
    "		<td class=\"control-group\" ng-class=\"{'error': invalidMinutes}\"><input type=\"text\" ng-model=\"minutes\" ng-change=\"updateMinutes()\" class=\"span1 text-center\" ng-readonly=\"readonlyInput\" maxlength=\"2\"></td>\n" +
    "		<td ng-show=\"showMeridian\"><button type=\"button\" ng-click=\"toggleMeridian()\" class=\"btn text-center\">{{meridian}}</button></td>\n" +
    "	</tr>\n" +
    "	<tr class=\"text-center\">\n" +
    "		<td><a ng-click=\"decrementHours()\" class=\"btn btn-link\"><i class=\"icon-chevron-down\"></i></a></td>\n" +
    "		<td>&nbsp;</td>\n" +
    "		<td><a ng-click=\"decrementMinutes()\" class=\"btn btn-link\"><i class=\"icon-chevron-down\"></i></a></td>\n" +
    "		<td ng-show=\"showMeridian\"></td>\n" +
    "	</tr>\n" +
    "</table>");
}]);

angular.module("template/typeahead/typeahead-match.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/typeahead/typeahead-match.html",
    "<a tabindex=\"-1\" bind-html-unsafe=\"match.label | typeaheadHighlight:query\"></a>");
}]);

angular.module("template/typeahead/typeahead-popup.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/typeahead/typeahead-popup.html",
    "<ul class=\"typeahead dropdown-menu\" ng-style=\"{display: isOpen()&&'block' || 'none', top: position.top+'px', left: position.left+'px'}\">\n" +
    "    <li ng-repeat=\"match in matches\" ng-class=\"{active: isActive($index) }\" ng-mouseenter=\"selectActive($index)\" ng-click=\"selectMatch($index)\">\n" +
    "        <typeahead-match index=\"$index\" match=\"match\" query=\"query\" template-url=\"templateUrl\"></typeahead-match>\n" +
    "    </li>\n" +
    "</ul>");
}]);

angular.module("template/typeahead/typeahead.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/typeahead/typeahead.html",
    "<ul class=\"typeahead dropdown-menu\" ng-style=\"{display: isOpen()&&'block' || 'none', top: position.top+'px', left: position.left+'px'}\">\n" +
    "    <li ng-repeat=\"match in matches\" ng-class=\"{active: isActive($index) }\" ng-mouseenter=\"selectActive($index)\">\n" +
    "        <a tabindex=\"-1\" ng-click=\"selectMatch($index)\" ng-bind-html-unsafe=\"match.label | typeaheadHighlight:query\"></a>\n" +
    "    </li>\n" +
    "</ul>");
}]);
