/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ReflectiveInjector, SimpleChange } from '@angular/core';
import { PropertyBinding } from './component_info';
import { $SCOPE } from './constants';
import { ContentProjectionHelper } from './content_projection_helper';
import { getComponentName, hookupNgModel } from './util';
var /** @type {?} */ INITIAL_VALUE = {
    __UNINITIALIZED__: true
};
var DowngradeComponentAdapter = (function () {
    /**
     * @param {?} id
     * @param {?} info
     * @param {?} element
     * @param {?} attrs
     * @param {?} scope
     * @param {?} ngModel
     * @param {?} parentInjector
     * @param {?} $injector
     * @param {?} $compile
     * @param {?} $parse
     * @param {?} componentFactory
     */
    function DowngradeComponentAdapter(id, info, element, attrs, scope, ngModel, parentInjector, $injector, $compile, $parse, componentFactory) {
        this.id = id;
        this.info = info;
        this.element = element;
        this.attrs = attrs;
        this.scope = scope;
        this.ngModel = ngModel;
        this.parentInjector = parentInjector;
        this.$injector = $injector;
        this.$compile = $compile;
        this.$parse = $parse;
        this.componentFactory = componentFactory;
        this.inputChangeCount = 0;
        this.inputChanges = null;
        this.componentRef = null;
        this.component = null;
        this.changeDetector = null;
        this.element[0].id = id;
        this.componentScope = scope.$new();
    }
    /**
     * @return {?}
     */
    DowngradeComponentAdapter.prototype.compileContents = function () {
        var _this = this;
        var /** @type {?} */ compiledProjectableNodes = [];
        // The projected content has to be grouped, before it is compiled.
        var /** @type {?} */ projectionHelper = this.parentInjector.get(ContentProjectionHelper);
        var /** @type {?} */ projectableNodes = projectionHelper.groupProjectableNodes(this.$injector, this.info.component, this.element.contents());
        var /** @type {?} */ linkFns = projectableNodes.map(function (nodes) { return _this.$compile(nodes); });
        this.element.empty();
        linkFns.forEach(function (linkFn) {
            linkFn(_this.scope, function (clone) {
                compiledProjectableNodes.push(clone);
                _this.element.append(clone);
            });
        });
        return compiledProjectableNodes;
    };
    /**
     * @param {?} projectableNodes
     * @return {?}
     */
    DowngradeComponentAdapter.prototype.createComponent = function (projectableNodes) {
        var /** @type {?} */ childInjector = ReflectiveInjector.resolveAndCreate([{ provide: $SCOPE, useValue: this.componentScope }], this.parentInjector);
        this.componentRef =
            this.componentFactory.create(childInjector, projectableNodes, this.element[0]);
        this.changeDetector = this.componentRef.changeDetectorRef;
        this.component = this.componentRef.instance;
        hookupNgModel(this.ngModel, this.component);
    };
    /**
     * @return {?}
     */
    DowngradeComponentAdapter.prototype.setupInputs = function () {
        var _this = this;
        var /** @type {?} */ attrs = this.attrs;
        var /** @type {?} */ inputs = this.info.inputs || [];
        for (var /** @type {?} */ i = 0; i < inputs.length; i++) {
            var /** @type {?} */ input = new PropertyBinding(inputs[i]);
            var /** @type {?} */ expr = null;
            if (attrs.hasOwnProperty(input.attr)) {
                var /** @type {?} */ observeFn = (function (prop) {
                    var /** @type {?} */ prevValue = INITIAL_VALUE;
                    return function (currValue) {
                        if (prevValue === INITIAL_VALUE) {
                            prevValue = currValue;
                        }
                        _this.updateInput(prop, prevValue, currValue);
                        prevValue = currValue;
                    };
                })(input.prop);
                attrs.$observe(input.attr, observeFn);
            }
            else if (attrs.hasOwnProperty(input.bindAttr)) {
                expr = ((attrs) /** TODO #9100 */)[input.bindAttr];
            }
            else if (attrs.hasOwnProperty(input.bracketAttr)) {
                expr = ((attrs) /** TODO #9100 */)[input.bracketAttr];
            }
            else if (attrs.hasOwnProperty(input.bindonAttr)) {
                expr = ((attrs) /** TODO #9100 */)[input.bindonAttr];
            }
            else if (attrs.hasOwnProperty(input.bracketParenAttr)) {
                expr = ((attrs) /** TODO #9100 */)[input.bracketParenAttr];
            }
            if (expr != null) {
                var /** @type {?} */ watchFn = (function (prop) { return function (currValue, prevValue) {
                    return _this.updateInput(prop, prevValue, currValue);
                }; })(input.prop);
                this.componentScope.$watch(expr, watchFn);
            }
        }
        var /** @type {?} */ prototype = this.info.component.prototype;
        if (prototype && ((prototype)).ngOnChanges) {
            // Detect: OnChanges interface
            this.inputChanges = {};
            this.componentScope.$watch(function () { return _this.inputChangeCount; }, function () {
                var /** @type {?} */ inputChanges = _this.inputChanges;
                _this.inputChanges = {};
                ((_this.component)).ngOnChanges(inputChanges);
            });
        }
        this.componentScope.$watch(function () { return _this.changeDetector && _this.changeDetector.detectChanges(); });
    };
    /**
     * @return {?}
     */
    DowngradeComponentAdapter.prototype.setupOutputs = function () {
        var _this = this;
        var /** @type {?} */ attrs = this.attrs;
        var /** @type {?} */ outputs = this.info.outputs || [];
        for (var /** @type {?} */ j = 0; j < outputs.length; j++) {
            var /** @type {?} */ output = new PropertyBinding(outputs[j]);
            var /** @type {?} */ expr = null;
            var /** @type {?} */ assignExpr = false;
            var /** @type {?} */ bindonAttr = output.bindonAttr ? output.bindonAttr.substring(0, output.bindonAttr.length - 6) : null;
            var /** @type {?} */ bracketParenAttr = output.bracketParenAttr ?
                "[(" + output.bracketParenAttr.substring(2, output.bracketParenAttr.length - 8) + ")]" :
                null;
            if (attrs.hasOwnProperty(output.onAttr)) {
                expr = ((attrs) /** TODO #9100 */)[output.onAttr];
            }
            else if (attrs.hasOwnProperty(output.parenAttr)) {
                expr = ((attrs) /** TODO #9100 */)[output.parenAttr];
            }
            else if (attrs.hasOwnProperty(bindonAttr)) {
                expr = ((attrs) /** TODO #9100 */)[bindonAttr];
                assignExpr = true;
            }
            else if (attrs.hasOwnProperty(bracketParenAttr)) {
                expr = ((attrs) /** TODO #9100 */)[bracketParenAttr];
                assignExpr = true;
            }
            if (expr != null && assignExpr != null) {
                var /** @type {?} */ getter = this.$parse(expr);
                var /** @type {?} */ setter = getter.assign;
                if (assignExpr && !setter) {
                    throw new Error("Expression '" + expr + "' is not assignable!");
                }
                var /** @type {?} */ emitter = (this.component[output.prop]);
                if (emitter) {
                    emitter.subscribe({
                        next: assignExpr ?
                            (function (setter) { return function (v /** TODO #9100 */) { return setter(_this.scope, v); }; })(setter) :
                            (function (getter) { return function (v /** TODO #9100 */) {
                                return getter(_this.scope, { $event: v });
                            }; })(getter)
                    });
                }
                else {
                    throw new Error("Missing emitter '" + output.prop + "' on component '" + getComponentName(this.info.component) + "'!");
                }
            }
        }
    };
    /**
     * @return {?}
     */
    DowngradeComponentAdapter.prototype.registerCleanup = function () {
        var _this = this;
        this.element.bind('$destroy', function () {
            _this.componentScope.$destroy();
            _this.componentRef.destroy();
        });
    };
    /**
     * @return {?}
     */
    DowngradeComponentAdapter.prototype.getInjector = function () { return this.componentRef && this.componentRef.injector; };
    /**
     * @param {?} prop
     * @param {?} prevValue
     * @param {?} currValue
     * @return {?}
     */
    DowngradeComponentAdapter.prototype.updateInput = function (prop, prevValue, currValue) {
        if (this.inputChanges) {
            this.inputChangeCount++;
            this.inputChanges[prop] = new SimpleChange(prevValue, currValue, prevValue === currValue);
        }
        this.component[prop] = currValue;
    };
    return DowngradeComponentAdapter;
}());
export { DowngradeComponentAdapter };
function DowngradeComponentAdapter_tsickle_Closure_declarations() {
    /** @type {?} */
    DowngradeComponentAdapter.prototype.inputChangeCount;
    /** @type {?} */
    DowngradeComponentAdapter.prototype.inputChanges;
    /** @type {?} */
    DowngradeComponentAdapter.prototype.componentScope;
    /** @type {?} */
    DowngradeComponentAdapter.prototype.componentRef;
    /** @type {?} */
    DowngradeComponentAdapter.prototype.component;
    /** @type {?} */
    DowngradeComponentAdapter.prototype.changeDetector;
    /** @type {?} */
    DowngradeComponentAdapter.prototype.id;
    /** @type {?} */
    DowngradeComponentAdapter.prototype.info;
    /** @type {?} */
    DowngradeComponentAdapter.prototype.element;
    /** @type {?} */
    DowngradeComponentAdapter.prototype.attrs;
    /** @type {?} */
    DowngradeComponentAdapter.prototype.scope;
    /** @type {?} */
    DowngradeComponentAdapter.prototype.ngModel;
    /** @type {?} */
    DowngradeComponentAdapter.prototype.parentInjector;
    /** @type {?} */
    DowngradeComponentAdapter.prototype.$injector;
    /** @type {?} */
    DowngradeComponentAdapter.prototype.$compile;
    /** @type {?} */
    DowngradeComponentAdapter.prototype.$parse;
    /** @type {?} */
    DowngradeComponentAdapter.prototype.componentFactory;
}
//# sourceMappingURL=downgrade_component_adapter.js.map