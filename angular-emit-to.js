'use strict';

angular.module('rpd.emitTo', [])

.config(['$provide', function($provide){
    $provide.decorator('$rootScope', ['$delegate', '$exceptionHandler', function($delegate, $exceptionHandler){
        var Scope = $delegate.constructor,
            scopeMethods = {},
            newScopeMethods = {},
            slice = [].slice,
            concat = function(array1, array2, index) {
                return array1.concat(slice.call(array2, index));
            };

        // Make a copy of $rootScope's original methods so that we can access
        // them to invoke super methods in the ones we override.
        for(var key in $delegate){
            if(typeof $delegate[key] == 'function')
            {
                scopeMethods[key] = $delegate[key];
            }
        }

        /**
         * @param {Boolean} isolate Whether or not the new scope should be isolated.
         * @returns {Scope} A new child scope
         *
         * @description Extends the built-in Scope#$new method to include new methods
         */
        newScopeMethods.$new = function(isolate) {
            // Because of how scope.$new works, the returned result
            // should already have our new methods.
            var newScope = scopeMethods.$new.call(this, isolate);

            // We have to do the work that normally a child class's
            // constructor would perform -- initializing our instance vars.
            newScope.$emitSpan = this.$emitSpan;
            newScope.$emitSpanVia = this.$emitSpanVia;
            newScope.$$emitToRegister = this.$$emitToRegister;

            return newScope;
        };

        /**
         * @param {String} id The specified id of the scope being registered.
         *
         * @description Registers a scope with the specified id
         */
        newScopeMethods.$$emitToRegister = function(id){
            var registeredScopes = this.$root.$$emitToRegistered;

            registeredScopes[id] = {
                $id: this.$id,
                scope: this
            };
        };

        /**
         * @param {String} id The specified id of the scope being deregistered.
         *
         * @description Deregisters a scope of the specified id
         */
        newScopeMethods.$$emitToDeregister = function(id){
            if(id) delete this.$root.$$emitToRegistered[id];
        };


        /**
         * @param {String} id The id to be targetted by the event.
         * @param {String} name The name of the event.
         * @param {...*} args Optional one or more arguments which will be passed onto the event listeners.
         * @return {Object} Event object.
         *
         * @description Dispatches an event to specific target scope by id
         */
        newScopeMethods.$emitTo = function(id, name, args){
            var empty = [],
                namedListeners,
                scope = this,
                registeredScopes = this.$root.$$emitToRegistered,
                stopPropagation = false,
                event = {
                    name: name,
                    targetScope: scope,
                    stopPropagation: function() {stopPropagation = true;},
                    preventDefault: function() {
                        event.defaultPrevented = true;
                    },
                    defaultPrevented: false
                },
                listenerArgs = concat([event], arguments, 1),
                i, length,
                type;

            listenerArgs.splice(1,1);

            function locateScope(){
                var scope = this,
                    sibling = scope.$$prevSibling,
                    x,
                    coords = { x: [], y: 0 };

                // Loop through all $parent levels
                do {
                    x = 0;

                    // Find x axis position at this $parent level and push index into x axis array
                    do {
                        if(sibling){
                            sibling = sibling.$$prevSibling;
                            x++;
                        }
                    } while (sibling);

                    coords.x.push(x);

                    scope = scope.$parent;
                    if(scope){
                        sibling = scope.$$prevSibling;
                        coords.y++;
                    }
                } while (scope);

                coords.x.pop();
                coords.x.reverse();
                return coords;
            }

            function fireEvent(id){
                var map = scope.$root.$$emitToRegistered[id] || null,
                    targetScope = scope.$root,
                    i;

                if(map)
                {
                    for(i=0; i<map.y; i++){
                        targetScope = targetScope.$$childHead;

                        for(var k=0; k<map.x[i]; k++){
                            targetScope = targetScope.$$nextSibling;
                        }
                    }

                    namedListeners = targetScope.$$listeners[name] || empty;
                    event.currentScope = targetScope;

                    for (i = 0, length = namedListeners.length; i < length; i++) {

                        // if listeners were deregistered, defragment the array
                        if (!namedListeners[i]) {
                            namedListeners.splice(i, 1);
                            i--;
                            length--;
                            continue;
                        }
                        try {
                            //allow all listeners attached to the current targetScope to run
                            namedListeners[i].apply(null, listenerArgs);
                        } catch (e) {
                            $exceptionHandler(e);
                        }
                    }
                }

                //if any listener on the current targetScope stops propagation, prevent bubbling
                if (stopPropagation) {
                    event.currentScope = null;
                    return event;
                }
            }

            type = id ? Object.prototype.toString.call(id) : null;
            id = type == "[object Array]" ? id : [id];

            for(i=0; i<id.length; i++){
                if(id[i])
                {
                    if(registeredScopes[id[i]])
                    {
                        angular.extend(registeredScopes[id[i]], locateScope.call(registeredScopes[id[i]].scope));
                    }
                    fireEvent(id[i]);
                }
            }

            event.currentScope = null;

            return event;
        };


        /**
         * @param {String} name The name of the event.
         * @param {...*} args Optional one or more arguments which will be passed onto the event listeners.
         * @return {Object} Event object.
         *
         * @description Dispatches an event to all direct sibling scopes.
         */
        newScopeMethods.$emitSpan = function(name, args){
            var empty = [],
                namedListeners,
                scope = this,
                stopPropagation = false,
                event = {
                    name: name,
                    targetScope: scope,
                    stopPropagation: function() {stopPropagation = true;},
                    preventDefault: function() {
                        event.defaultPrevented = true;
                    },
                    defaultPrevented: false
                },
                listenerArgs = concat([event], arguments, 1),
                i, length,
                firstTime = true;

            function span(scope, direction){
                var startingScope = scope;

                do {
                    if(scope !== startingScope || firstTime)
                    {
                        firstTime = false;

                        namedListeners = scope.$$listeners[name] || empty;
                        event.currentScope = scope;
                        for (i = 0, length = namedListeners.length; i < length; i++) {

                            // if listeners were deregistered, defragment the array
                            if (!namedListeners[i]) {
                                namedListeners.splice(i, 1);
                                i--;
                                length--;
                                continue;
                            }
                            try {
                                //allow all listeners attached to the current scope to run
                                namedListeners[i].apply(null, listenerArgs);
                            } catch (e) {
                                $exceptionHandler(e);
                            }
                        }
                        //if any listener on the current scope stops propagation, prevent bubbling
                        if (stopPropagation) {
                            event.currentScope = null;
                            return event;
                        }
                    }

                    //traverse laterally
                    scope = scope['$$'+direction+'Sibling'];
                } while (scope);
            }

            span(scope, 'prev');
            span(scope, 'next');

            event.currentScope = null;

            return event;
        };


        /**
         * @param {String} id The id of the scope that will be used to transmit the event.
         * @param {String} name The name of the event.
         * @param {...*} args Optional one or more arguments which will be passed onto the event listeners.
         * @return {Object} Event object.
         *
         * @description Dispatches an event to all cousin scopes via a direct common ancestor.
         */
        newScopeMethods.$emitSpanVia = function(id, name, args){
            var empty = [],
                namedListeners,
                scope = this,
                lastScope,
                targetScopeId = this.$root.$$emitToRegistered[id] ? this.$root.$$emitToRegistered[id].$id : null,
                targetFound = false,
                stopPropagation = false,
                event = {
                    name: name,
                    targetScope: scope,
                    stopPropagation: function() {stopPropagation = true;},
                    preventDefault: function() {
                        event.defaultPrevented = true;
                    },
                    defaultPrevented: false
                },
                listenerArgs = concat([event], arguments, 1),
                i, length,
                y = 0, x = 0;

            listenerArgs.splice(1,1);

            function traverse(){
                var currentScope = scope.$$childHead,
                    i;

                // When a child scope branches
                function branch(childScope, i){
                    i = i || 0;

                    // Recursively traverse across ancestor's sibling and child scopes,
                    // down the prescribed 'y' distance and emit span event
                    for(; i<y-1; i++){
                        if(i > 0 && childScope && childScope.$$nextSibling) {
                            branch(childScope.$$nextSibling, i);
                        }

                        if(childScope && childScope.$$childHead) {
                            childScope = childScope.$$childHead;
                        } else {
                            childScope = null
                        }
                    }

                    if(childScope && i == y-1){
                        newScopeMethods.$emitSpan.call(childScope, name, args);
                    }
                }

                // Future hopes of emitting events outward from the emitting scope
                // in both directions.
                function traverseInDir(currentScope, direction) {
                    do {
                        currentScope = currentScope['$$'+direction+'Sibling'] || null;
                        branch(currentScope);

                    } while (currentScope);
                }

                // See above comment
                // Initialize currentScope at branch where event originated
                for(i=1; i<x; i++){
                    currentScope = currentScope.$$nextSibling;
                }

                // Begin scope traversal if child distance is greater than 1
                // level down. If not, just simply $emitSpan
                if(y > 1)
                {
                    branch(currentScope);
                    traverseInDir(currentScope, 'prev');
                    traverseInDir(currentScope, 'next');
                }
                else
                {
                    newScopeMethods.$emitSpan.call(scope.$$childHead, name, args);
                }

            }

            // Discover distance of specified common ancestor scope
            do {
                scope = scope.$parent;
                if(scope){
                    y++;
                    if(scope.$id == targetScopeId)
                    {
                        targetFound = true;

                        do {
                            lastScope = lastScope ? lastScope.$$prevSibling : null;
                            x++;
                        } while (lastScope);

                        break;
                    }
                }
                lastScope = scope;
            } while (scope); // Leave scope defined as discovered common ancestor

            // If the scope was found, begin scope traversal
            if(targetFound) traverse();

            event.currentScope = null;

            return event;
        };

        angular.extend(Scope.prototype, newScopeMethods);
        angular.extend($delegate, newScopeMethods);

        $delegate.$$emitToRegistered = {};

        return $delegate;
    }]);
}])

.directive('emitToId', [function(){

    return {
        restrict: 'A',
        link: function (scope, elem, attrs) {

            scope.$$emitToId = function(){
                return attrs['emitToId'];
            };

            scope.$watch('$$emitToId()', function(newVal, oldVal){
                scope.$$emitToDeregister(oldVal);
                scope.$$emitToRegister(attrs['emitToId']);
            });

            scope.$on('$destroy', function(){
                scope.$$emitToDeregister(scope.$$emitToId());
            });
        }
    };

}]);