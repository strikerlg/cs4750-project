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