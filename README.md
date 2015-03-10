# Angular Emit-To


## An AngularJS module that provides new event dispatch paths to the existing event model

Angular provides two methods for dispatching events `Scope#$broadcast` which dispatches an event downwards to all child scopes, and `Scope#$emit` which dispatches an event upward through the scope hierarchy. Both will call all registered listeners along the way and start from the scope the method was called from.

In cases where neither `$emit` nor `$broadcast` is suitable, Emit-To provides additional, more targetted path options.


## Get Started

If you use bower, simply `bower install angular-emit-to`, otherwise download the `angular-emit-to.js` source and include it in your code
```html
<script src="angular.js"></script>
<script src="angular-emit-to.js"></script>
```

Add the `rpd.emit-to` module dependency to your application.

```js
angular.module('app', ['rpd.emit-to']);
```

## Directive

### emit-to-id

Registers the scope of a given element with a custom identifier to enable event scope targetting and event scope transit with [Scope#$emitTo](#scopeemitto) and [Scope#$emitSpanVia](#scopeemitspanvia).

#### Usage

```html
<div ng-controller="ctrl1" emit-to-id="ex1"></div>

<!-- Can also be interpolated -->
<div ng-repeat="i in [1,2,3,4,5]"
     ng-controller="ctrl1"
     emit-to-id="{{ 'ex' + i }}">
</div>
```


## Methods

### Scope#$emitTo

Dispatches an event to the specified scope by id or a list of ids as registered by the `emit-to-id` directive.

```js
scope.$emitTo(emit-to-id(s), eventname, [...args])
// As with Scope#$emit and Scope#$broadcast, an event object is returned
```

#### Usage

Register an element's scope with the `emit-to-id` directive

```html
<!-- emit-to-id must be attached to the same scope as the listener
     as there is no event propagation -->
<div ng-controller="ctrl1" emit-to-id="ex1"></div>
<div ng-controller="ctrl1" emit-to-id="ex2"></div>
```

```js
// Inside of the controller(s) that you've attached the emit-to-id, subscribe to an event as usual
app.controller('ctrl1', ['$scope', function($scope) {

    $scope.$on("sample", function(e, text) {
        // Do something
    });

}]);
```

```js
// Emit an event to the specified scope
$scope.$emitTo("ex1", "sample", "Event fired.");

// With a list of target ids
$scope.$emitTo(["ex1", "ex2"], "sample", "Event fired.");
```

--

### Scope#$emitSpan

Dispatches an event laterally (left and right) to all direct sibling scopes.

```js
scope.$emitSpan(eventname, [...args])
// As with Scope#$emit and Scope#$broadcast, an event object is returned
```

#### Usage

```html
<div ng-controller="siblingCtrl"></div>
<div ng-controller="siblingCtrl"></div>
<div ng-controller="siblingCtrl"></div>
```

```js
// Inside of your controller(s), subscribe to an event as usual
app.controller('siblingCtrl', ['$scope', function($scope) {

    $scope.$on("sample", function(e, text) {
        // Do something
    });

}]);
```

```js
// Emit an event to all direct sibling scopes
// Note: there is no event propagation, you have Scope#$emit and Scope#$broadcast for that.
$scope.$emitSpan("sample");
```

--

### Scope#$emitSpanVia

Dispatches an event to all (nth-level) cousin scopes via their direct common ancestor (i.e. a grandparent or great-grandparent) as defined by the `emit-to-id` directive.

Cousin scopes are scopes that descend from a common ancestor (n-levels above) and are inaccessible via the Scope#$$prevSibling and Scope#$$nextSibling properties due to inherent scope boundaries.

The most common example would be descendents of an `ng-repeat` as every iteration creates a new scope. While there is a clear boundary dividing these children, there is also an implied relationship between them.

```js
scope.$emitSpanVia(emit-to-id, eventname, [...args])
// As with Scope#$emit and Scope#$broadcast, an event object is returned
```

#### Usage

```html
<div ng-repeat="i in [1,2,3,4]" emit-to-id="gp1">
    <div ng-controller="cousinCtrl"></div>
</div>
```

```html
<!-- Without ng-repeat -->
<div ng-controller="grandparentCtrl" emit-to-id="gp1">
    <div ng-controller="parentCtrl">
        <div ng-controller="cousinCtrl"></div>
    </div>
    <div ng-controller="parentCtrl">
        <div ng-controller="cousinCtrl"></div>
    </div>
</div>
```

```js
// Inside of your controller(s), subscribe to an event as usual
app.controller('cousinCtrl', ['$scope', function($scope) {

    $scope.$on("sample", function(e, text) {
        // Do something
    });

}]);
```

```js
// Emit an event "sample" to all cousin scopes via
// the common ancestor (in this case grandparent) "gp1"
$scope.$emitSpanVia("gp1", "sample");
```

## Examples

Try out the examples [here](http://rpdasilva.github.io/angular-emit-to/)


## Todos

- More controlled order of event calls in emitSpanVia
- Unit tests


## License

`angular-emit-to` is [MIT licensed](LICENSE.txt)