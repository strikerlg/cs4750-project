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