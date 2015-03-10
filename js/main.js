angular.module('emitTo', ['rpd.emitTo'])
.controller('Ctrl', ['$scope', function($scope) {

    this.emitToExample = function() {
        $scope.$emitTo($scope.$root.emitId, "example1", "Event fired from: "+$scope.$$emitToId());
    };

    $scope.$on("example1", function(e, text) {
        this.eventText = text;
    }.bind(this));

    $scope.$on("clear", function() {
        this.eventText = '';
    }.bind(this));
}]);


angular.module('emitSpan', ['rpd.emitTo'])
.controller('Ctrl', ['$scope', function($scope) {

    this.spanEvent = function() {
        $scope.$emitSpan("example2", "Event spanned");
    };

    $scope.$on("example2", function(e, text) {
        this.eventText = text;
    }.bind(this));

    $scope.$on("clear", function() {
        this.eventText = '';
    }.bind(this));
}]);


angular.module('emitSpanVia', ['rpd.emitTo'])
.controller('Ctrl', ['$scope', function($scope) {

    this.spanVia = function() {
        $scope.$emitSpanVia("gp1", "example3", "Event spanned via gp1");
    };

    $scope.$on("example3", function(e, text) {
        this.eventText = text;
    }.bind(this));

    $scope.$on("clear", function() {
        this.eventText = '';
    }.bind(this));
}]);



angular.bootstrap(document.getElementById('ex1'), ['emitTo']);
angular.bootstrap(document.getElementById('ex2'), ['emitSpan']);
angular.bootstrap(document.getElementById('ex3'), ['emitSpanVia']);