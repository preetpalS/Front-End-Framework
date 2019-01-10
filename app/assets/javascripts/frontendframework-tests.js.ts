/// <reference path="type_definitions/qunit/qunit.d.ts"/>
/// <reference path="frontendframework/all.js.ts"/>

QUnit.test("version number export", function(assert) {
    assert.ok(FrontEndFramework.VERSION != null);
});

//
// These mainly test to make sure that gHndl and hooks are not overwritten
//

QUnit.test("global handle basics", function(assert) {
    assert.notStrictEqual((typeof FrontEndFramework.gHndl), 'undefined');
    assert.equal(FrontEndFramework.gHndl, window);
});

QUnit.test("hooks basics", function(assert) {
    assert.notStrictEqual((typeof FrontEndFramework.hooks), 'undefined');
    assert.equal((<any>FrontEndFramework.gHndl).FrontEndFramework.hooks, FrontEndFramework.hooks);
    assert.ok(FrontEndFramework.hooks.pre instanceof Array);
    assert.ok(FrontEndFramework.hooks.post instanceof Array);
});

//
// FrontEndFramework.MiniHtmlViewModel
//

QUnit.test("MiniHtmlViewModel basics", function(assert) {
    // Tests if MiniHtmlViewModel namespace is available
    assert.notStrictEqual(FrontEndFramework.MiniHtmlViewModel, 'undefined');
});

QUnit.test("MiniHtmlViewModel ViewModelProperty basics", function(assert) {
    assert.ok(FrontEndFramework.MiniHtmlViewModel.ViewModelProperty != null);
    assert.ok(
        (new FrontEndFramework.MiniHtmlViewModel.ViewModelProperty(
            FrontEndFramework.MiniHtmlViewModel.BindingMode.OneTime,
            'test'
        )) instanceof FrontEndFramework.MiniHtmlViewModel.ViewModelProperty
    );
});

QUnit.test("view sanity test", function(assert) {
    assert.ok(document.getElementById('fef') != null);
});

QUnit.test("MiniHtmlViewModel.ViewModel keeps track of changes", function(assert) {
    class TestCase1ViewModel extends FrontEndFramework.MiniHtmlViewModel.ViewModel {
        static SelectItemId = 'test-case-1-select-item';
        static GroupSelectItem1Id = 'test-case-1-group-select-item-1';
        static GroupSelectItem2Id = 'test-case-1-group-select-item-2';
        static GroupSelectItem3Id = 'test-case-1-group-select-item-3';
        static TwoWayBindingItemId = 'test-case-1-two-way-binding-item';

        constructor() {
            super(FrontEndFramework.ObjectLifeCycle.Transient, {
                bindingMode: FrontEndFramework.MiniHtmlViewModel.BindingMode.OneWayRead,
                id: TestCase1ViewModel.SelectItemId,
                changeEvents: 'textInput input'
            }, {
                bindingMode: FrontEndFramework.MiniHtmlViewModel.BindingMode.OneWayRead,
                id: [TestCase1ViewModel.GroupSelectItem1Id, TestCase1ViewModel.GroupSelectItem2Id,
                     TestCase1ViewModel.GroupSelectItem3Id]
            }, {
                bindingMode: FrontEndFramework.MiniHtmlViewModel.BindingMode.TwoWay,
                id: TestCase1ViewModel.TwoWayBindingItemId,
                changeEvents: 'input'
            });
        }

        onChange(htmlId: string) {
            switch(htmlId) {
                case TestCase1ViewModel.SelectItemId:
                case TestCase1ViewModel.GroupSelectItem1Id:
                case TestCase1ViewModel.GroupSelectItem2Id:
                case TestCase1ViewModel.GroupSelectItem3Id:
                case TestCase1ViewModel.TwoWayBindingItemId:
                    assert.ok(true);
                    break;
                default:
                    assert.ok(false);
                    break;
            }
        }

        selectFormValue() : number {
            return <number>+(this.idToBindableProperty[TestCase1ViewModel.SelectItemId].value);
        }

        GroupSelectForm1Value() : number {
            return <number>+(this.idToBindableProperty[TestCase1ViewModel.GroupSelectItem1Id].value);
        }

        GroupSelectForm2Value() : number {
            return <number>+(this.idToBindableProperty[TestCase1ViewModel.GroupSelectItem2Id].value);
        }

        GroupSelectForm3Value() : number {
            return <number>+(this.idToBindableProperty[TestCase1ViewModel.GroupSelectItem3Id].value);
        }

        TwoWayBindingItemFormValue() : number {
            return <number>+(this.idToBindableProperty[TestCase1ViewModel.TwoWayBindingItemId].value);
        }
    }
    let tc1vm = new TestCase1ViewModel();

    assert.strictEqual(tc1vm.selectFormValue(), 0);
    assert.strictEqual(<number>+(((<any>document.getElementById(TestCase1ViewModel.SelectItemId)).value)), 0);
    assert.strictEqual(tc1vm.selectFormValue(), <number>+((<HTMLInputElement>document.getElementById(`${TestCase1ViewModel.SelectItemId}`)).value));
    assert.strictEqual(tc1vm.TwoWayBindingItemFormValue(), 0);

    (<HTMLInputElement>document.getElementById(`${TestCase1ViewModel.SelectItemId}`)).value = "21";

    if (typeof Event === "function") {
        (<any>document.getElementById(`${TestCase1ViewModel.SelectItemId}`)).dispatchEvent(new Event("change"));
    } else {
        // IE11 compatibility for test suite
        let ev1 = (<any>document).createEvent("Event");
        ev1.initEvent("change", true, true);
        (<any>document.getElementById(`${TestCase1ViewModel.SelectItemId}`)).dispatchEvent(<Event>ev1);
    }

    // Change Event should not affect value stored in ViewModel
    assert.strictEqual(tc1vm.selectFormValue(), 0);

    if (typeof Event === "function") {
        (<any>document.getElementById(`${TestCase1ViewModel.SelectItemId}`)).dispatchEvent(new Event("input"));
    } else {
        // IE11 compatibility for test suite
        let ev1 = (<any>document).createEvent("Event");
        ev1.initEvent("input", true, true);
        (<any>document.getElementById(`${TestCase1ViewModel.SelectItemId}`)).dispatchEvent(<Event>ev1);
    }

    assert.strictEqual(tc1vm.selectFormValue(), 21);

    (<HTMLInputElement>document.getElementById(`${TestCase1ViewModel.TwoWayBindingItemId}`)).value = "3";

    if (typeof Event === "function") {
        (<any>document.getElementById(`${TestCase1ViewModel.TwoWayBindingItemId}`)).dispatchEvent(new Event("input"));
    } else {
        // IE11 compatibility for test suite
        let ev1 = (<any>document).createEvent("Event");
        ev1.initEvent("input", true, true);
        (<any>document.getElementById(`${TestCase1ViewModel.TwoWayBindingItemId}`)).dispatchEvent(<Event>ev1);
    }

    assert.notStrictEqual(tc1vm.TwoWayBindingItemFormValue(), 0); // Implies internal form value resets itself
    assert.strictEqual(tc1vm.TwoWayBindingItemFormValue(), 3);

    (<HTMLInputElement>document.getElementById(`${TestCase1ViewModel.SelectItemId}`)).value = "1";

    if (typeof Event === "function") {
        (<any>document.getElementById(`${TestCase1ViewModel.SelectItemId}`)).dispatchEvent(new Event("textInput"));
    } else {
        // IE11 compatibility for test suite
        let ev1 = (<any>document).createEvent("Event");
        ev1.initEvent("textInput", true, true);
        (<any>document.getElementById(`${TestCase1ViewModel.SelectItemId}`)).dispatchEvent(<Event>ev1);
    }

    assert.strictEqual(tc1vm.selectFormValue(), 1);

    assert.strictEqual(tc1vm.GroupSelectForm1Value(), 3);
    assert.strictEqual(tc1vm.GroupSelectForm2Value(), 4);
    assert.strictEqual(tc1vm.GroupSelectForm3Value(), 3);

    (<HTMLInputElement>document.getElementById(`${TestCase1ViewModel.GroupSelectItem2Id}`)).value = "1";
    if (typeof Event === "function") {
        (<any>document.getElementById(`${TestCase1ViewModel.GroupSelectItem2Id}`)).dispatchEvent(new Event("change"));
    } else {
        // IE11 compatibility for test suite
        let ev2 = (<any>document).createEvent("Event");
        ev2.initEvent("change", true, true);
        (<any>document.getElementById(`${TestCase1ViewModel.GroupSelectItem2Id}`)).dispatchEvent(<Event>ev2);
    }

    assert.strictEqual(tc1vm.GroupSelectForm1Value(), 3);
    assert.strictEqual(tc1vm.GroupSelectForm2Value(), 1);
    assert.strictEqual(tc1vm.GroupSelectForm3Value(), 3);

    // Reset Values

    (<HTMLInputElement>document.getElementById(`${TestCase1ViewModel.SelectItemId}`)).value = "0";
    (<HTMLInputElement>document.getElementById(`${TestCase1ViewModel.GroupSelectItem1Id}`)).value = "3";
    (<HTMLInputElement>document.getElementById(`${TestCase1ViewModel.GroupSelectItem2Id}`)).value = "4";
    (<HTMLInputElement>document.getElementById(`${TestCase1ViewModel.GroupSelectItem3Id}`)).value = "3";
    (<HTMLInputElement>document.getElementById(`${TestCase1ViewModel.TwoWayBindingItemId}`)).value = "0";
});

QUnit.test("Pub Sub system is able to relay data to subscribers", (assert) => {
    new FrontEndFramework.PubSub.HtmlInputElementPublisherAndSubscriber(
        'test-case-2-color-sync',
        'test-case-2-select-item-1'
    );

    new FrontEndFramework.PubSub.HtmlInputElementPublisherAndSubscriber(
        'test-case-2-color-sync',
        'test-case-2-select-item-2'
    );

    FrontEndFramework.PubSub.subscribe(
        'test-case-2-color-sync',
        '#test-case-2-select-item-3'
    );

    // Single test still fails on IE11 after refresh (used to fail on Firefox as well)
    assert.strictEqual((<HTMLInputElement>document.getElementById('test-case-2-select-item-1')).value, 'red');

    assert.strictEqual((<HTMLInputElement>document.getElementById('test-case-2-select-item-2')).value, 'green');
    assert.strictEqual((<HTMLInputElement>document.getElementById('test-case-2-select-item-3')).value, 'green');

    FrontEndFramework.PubSub.publish('test-case-2-color-sync', 'blue');

    assert.strictEqual((<HTMLInputElement>document.getElementById('test-case-2-select-item-1')).value, 'blue');
    assert.strictEqual((<HTMLInputElement>document.getElementById('test-case-2-select-item-2')).value, 'blue');
    assert.strictEqual((<HTMLInputElement>document.getElementById('test-case-2-select-item-3')).value, 'blue');

    (<HTMLInputElement>document.getElementById('test-case-2-select-item-3')).value = 'red';

    assert.strictEqual((<HTMLInputElement>document.getElementById('test-case-2-select-item-1')).value, 'blue');
    assert.strictEqual((<HTMLInputElement>document.getElementById('test-case-2-select-item-2')).value, 'blue');
    assert.strictEqual((<HTMLInputElement>document.getElementById('test-case-2-select-item-3')).value, 'red');

    (<HTMLInputElement>document.getElementById('test-case-2-select-item-2')).value = 'green';
    if (typeof Event === "function") {
        (<HTMLElement>document.getElementById('test-case-2-select-item-2')).dispatchEvent(new Event('change'));
    } else {
        // IE11 compatibility for test suite
        let ev3 = (<any>document).createEvent("Event");
        ev3.initEvent("change", true, true);
        (<HTMLElement>document.getElementById('test-case-2-select-item-2')).dispatchEvent(<Event>ev3);
    }

    assert.strictEqual((<HTMLInputElement>document.getElementById('test-case-2-select-item-1')).value, 'green');
    assert.strictEqual((<HTMLInputElement>document.getElementById('test-case-2-select-item-2')).value, 'green');
    assert.strictEqual((<HTMLInputElement>document.getElementById('test-case-2-select-item-3')).value, 'green');
});
