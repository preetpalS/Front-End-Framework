
import {assert} from "chai";
import Base from "../javascripts/base";
import BodyScriptActivator from "../javascripts/body_script_activator";
import VERSION from "../javascripts/constants/version";
import { ObjectLifeCycle } from "../javascripts/enumerations/object_life_cycle";
import {MiniHtmlViewModel} from "../javascripts/mini_html_view_model";
import {HtmlInputElementPublisherAndSubscriber, publish, setup, subscribe} from "../javascripts/pub_sub";
import Runtime from "../javascripts/runtime";
import "mocha";


const baseInstance = Base.getInstance(window);
setup();
Runtime.getInstance();

baseInstance.hooks.pre.push(() => {
    BodyScriptActivator.getInstance().AddEntryToLookupTable("#test-case-3-hidden-text-message", (_activationHtmlElement) => {
        (document.getElementById("test-case-3-hidden-text-message") as HTMLElement).innerHTML = "Body script activation system is working!";
    });
});

it("version number export", () => {
    assert.ok(VERSION != null);
});

//
// These mainly test to make sure that gHndl and hooks are not overwritten
//

it("global handle basics", () => {
    assert.notStrictEqual((typeof baseInstance.gHndl), "undefined");
    assert.equal(baseInstance.gHndl, window);
});

it("hooks basics", () => {
    assert.notStrictEqual((typeof baseInstance.hooks), "undefined");
    // The behaviour as described in the following line is no longer guaranteed:
    // assert.equal((baseInstance.gHndl as any).baseInstance.hooks, baseInstance.hooks);
    assert.ok(baseInstance.hooks.pre instanceof Array);
    assert.ok(baseInstance.hooks.post instanceof Array);
});

//
// MiniHtmlViewModel
//

it("MiniHtmlViewModel basics", () => {
    // Tests if MiniHtmlViewModel namespace is available
    assert.notStrictEqual(MiniHtmlViewModel as any, "undefined");
});

it("MiniHtmlViewModel ViewModelProperty basics", () => {
    assert.ok(MiniHtmlViewModel.ViewModelProperty != null);
    assert.ok(
        (new MiniHtmlViewModel.ViewModelProperty(
            MiniHtmlViewModel.BindingMode.OneTime,
            "test"
        )) instanceof MiniHtmlViewModel.ViewModelProperty
    );
});

it("view sanity test", () => {
    assert.ok(document.getElementById("fef") != null);
});

it("MiniHtmlViewModel.ViewModel keeps track of changes", () => {
    class TestCase1ViewModel extends MiniHtmlViewModel.ViewModel {
        public static SELECT_ITEM_ID = "test-case-1-select-item";
        public static GROUP_SELECT_ITEM1_ID = "test-case-1-group-select-item-1";
        public static GROUP_SELECT_ITEM2_ID = "test-case-1-group-select-item-2";
        public static GROUP_SELECT_ITEM3_ID = "test-case-1-group-select-item-3";
        public static TWO_WAY_BINDING_ITEM_ID = "test-case-1-two-way-binding-item";

        constructor() {
            super(ObjectLifeCycle.Transient, {
                bindingMode: MiniHtmlViewModel.BindingMode.OneWayRead,
                changeEvents: "textInput input",
                id: TestCase1ViewModel.SELECT_ITEM_ID,

            }, {
                bindingMode: MiniHtmlViewModel.BindingMode.OneWayRead,
                id: [TestCase1ViewModel.GROUP_SELECT_ITEM1_ID, TestCase1ViewModel.GROUP_SELECT_ITEM2_ID,
                     TestCase1ViewModel.GROUP_SELECT_ITEM3_ID],
            }, {
                bindingMode: MiniHtmlViewModel.BindingMode.TwoWay,
                changeEvents: "input",
                id: TestCase1ViewModel.TWO_WAY_BINDING_ITEM_ID,

            });
        }

        public onChange(htmlId: string) {
            switch (htmlId) {
                case TestCase1ViewModel.SELECT_ITEM_ID:
                case TestCase1ViewModel.GROUP_SELECT_ITEM1_ID:
                case TestCase1ViewModel.GROUP_SELECT_ITEM2_ID:
                case TestCase1ViewModel.GROUP_SELECT_ITEM3_ID:
                case TestCase1ViewModel.TWO_WAY_BINDING_ITEM_ID:
                    assert.ok(true);
                    break;
                default:
                    assert.ok(false);
                    break;
            }
        }

        public selectFormValue(): number {
            return +(this.idToBindableProperty[TestCase1ViewModel.SELECT_ITEM_ID].value) as number;
        }

        public GroupSelectForm1Value(): number {
            return +(this.idToBindableProperty[TestCase1ViewModel.GROUP_SELECT_ITEM1_ID].value) as number;
        }

        public GroupSelectForm2Value(): number {
            return +(this.idToBindableProperty[TestCase1ViewModel.GROUP_SELECT_ITEM2_ID].value) as number;
        }

        public GroupSelectForm3Value(): number {
            return +(this.idToBindableProperty[TestCase1ViewModel.GROUP_SELECT_ITEM3_ID].value) as number;
        }

        public TwoWayBindingItemFormValue(): number {
            return +(this.idToBindableProperty[TestCase1ViewModel.TWO_WAY_BINDING_ITEM_ID].value) as number;
        }
    }
    const tc1vm = new TestCase1ViewModel();

    assert.strictEqual(tc1vm.selectFormValue(), 0);
    assert.strictEqual(+(((document.getElementById(TestCase1ViewModel.SELECT_ITEM_ID) as any).value)) as number, 0);
    assert.strictEqual(tc1vm.selectFormValue(), +((document.getElementById(`${TestCase1ViewModel.SELECT_ITEM_ID}`) as HTMLInputElement).value) as number);
    assert.strictEqual(tc1vm.TwoWayBindingItemFormValue(), 0);

    (document.getElementById(`${TestCase1ViewModel.SELECT_ITEM_ID}`) as HTMLInputElement).value = "21";

    if (typeof Event === "function") {
        (document.getElementById(`${TestCase1ViewModel.SELECT_ITEM_ID}`) as any).dispatchEvent(new Event("change"));
    } else {
        // IE11 compatibility for test suite
        const ev1 = (document as any).createEvent("Event");
        ev1.initEvent("change", true, true);
        (document.getElementById(`${TestCase1ViewModel.SELECT_ITEM_ID}`) as any).dispatchEvent(ev1 as Event);
    }

    // Change Event should not affect value stored in ViewModel
    assert.strictEqual(tc1vm.selectFormValue(), 0);

    if (typeof Event === "function") {
        (document.getElementById(`${TestCase1ViewModel.SELECT_ITEM_ID}`) as any).dispatchEvent(new Event("input"));
    } else {
        // IE11 compatibility for test suite
        const ev1 = (document as any).createEvent("Event");
        ev1.initEvent("input", true, true);
        (document.getElementById(`${TestCase1ViewModel.SELECT_ITEM_ID}`) as any).dispatchEvent(ev1 as Event);
    }

    assert.strictEqual(tc1vm.selectFormValue(), 21);

    (document.getElementById(`${TestCase1ViewModel.TWO_WAY_BINDING_ITEM_ID}`) as HTMLInputElement).value = "3";

    if (typeof Event === "function") {
        (document.getElementById(`${TestCase1ViewModel.TWO_WAY_BINDING_ITEM_ID}`) as any).dispatchEvent(new Event("input"));
    } else {
        // IE11 compatibility for test suite
        const ev1 = (document as any).createEvent("Event");
        ev1.initEvent("input", true, true);
        (document.getElementById(`${TestCase1ViewModel.TWO_WAY_BINDING_ITEM_ID}`) as any).dispatchEvent(ev1 as Event);
    }

    assert.notStrictEqual(tc1vm.TwoWayBindingItemFormValue(), 0); // Implies internal form value resets itself
    assert.strictEqual(tc1vm.TwoWayBindingItemFormValue(), 3);

    (document.getElementById(`${TestCase1ViewModel.SELECT_ITEM_ID}`) as HTMLInputElement).value = "1";

    if (typeof Event === "function") {
        (document.getElementById(`${TestCase1ViewModel.SELECT_ITEM_ID}`) as any).dispatchEvent(new Event("textInput"));
    } else {
        // IE11 compatibility for test suite
        const ev1 = (document as any).createEvent("Event");
        ev1.initEvent("textInput", true, true);
        (document.getElementById(`${TestCase1ViewModel.SELECT_ITEM_ID}`) as any).dispatchEvent(ev1 as Event);
    }

    assert.strictEqual(tc1vm.selectFormValue(), 1);

    assert.strictEqual(tc1vm.GroupSelectForm1Value(), 3);
    assert.strictEqual(tc1vm.GroupSelectForm2Value(), 4);
    assert.strictEqual(tc1vm.GroupSelectForm3Value(), 3);

    (document.getElementById(`${TestCase1ViewModel.GROUP_SELECT_ITEM2_ID}`) as HTMLInputElement).value = "1";
    if (typeof Event === "function") {
        (document.getElementById(`${TestCase1ViewModel.GROUP_SELECT_ITEM2_ID}`) as any).dispatchEvent(new Event("change"));
    } else {
        // IE11 compatibility for test suite
        const ev2 = (document as any).createEvent("Event");
        ev2.initEvent("change", true, true);
        (document.getElementById(`${TestCase1ViewModel.GROUP_SELECT_ITEM2_ID}`) as any).dispatchEvent(ev2 as Event);
    }

    assert.strictEqual(tc1vm.GroupSelectForm1Value(), 3);
    assert.strictEqual(tc1vm.GroupSelectForm2Value(), 1);
    assert.strictEqual(tc1vm.GroupSelectForm3Value(), 3);

    // Reset Values

    (document.getElementById(`${TestCase1ViewModel.SELECT_ITEM_ID}`) as HTMLInputElement).value = "0";
    (document.getElementById(`${TestCase1ViewModel.GROUP_SELECT_ITEM1_ID}`) as HTMLInputElement).value = "3";
    (document.getElementById(`${TestCase1ViewModel.GROUP_SELECT_ITEM2_ID}`) as HTMLInputElement).value = "4";
    (document.getElementById(`${TestCase1ViewModel.GROUP_SELECT_ITEM3_ID}`) as HTMLInputElement).value = "3";
    (document.getElementById(`${TestCase1ViewModel.TWO_WAY_BINDING_ITEM_ID}`) as HTMLInputElement).value = "0";
});

it("Pub Sub system is able to relay data to subscribers", () => {
    // tslint:disable-next-line:no-unused-expression
    new HtmlInputElementPublisherAndSubscriber(
        "test-case-2-color-sync",
        "test-case-2-select-item-1"
    );

    // tslint:disable-next-line:no-unused-expression
    new HtmlInputElementPublisherAndSubscriber(
        "test-case-2-color-sync",
        "test-case-2-select-item-2"
    );

    subscribe(
        "test-case-2-color-sync",
        "#test-case-2-select-item-3"
    );

    // Single test still fails on IE11 after refresh (used to fail on Firefox as well)
    assert.strictEqual((document.getElementById("test-case-2-select-item-1") as HTMLInputElement).value, "red");

    assert.strictEqual((document.getElementById("test-case-2-select-item-2") as HTMLInputElement).value, "green");
    assert.strictEqual((document.getElementById("test-case-2-select-item-3") as HTMLInputElement).value, "green");

    publish("test-case-2-color-sync", "blue");

    assert.strictEqual((document.getElementById("test-case-2-select-item-1") as HTMLInputElement).value, "blue");
    assert.strictEqual((document.getElementById("test-case-2-select-item-2") as HTMLInputElement).value, "blue");
    assert.strictEqual((document.getElementById("test-case-2-select-item-3") as HTMLInputElement).value, "blue");

    (document.getElementById("test-case-2-select-item-3") as HTMLInputElement).value = "red";

    assert.strictEqual((document.getElementById("test-case-2-select-item-1") as HTMLInputElement).value, "blue");
    assert.strictEqual((document.getElementById("test-case-2-select-item-2") as HTMLInputElement).value, "blue");
    assert.strictEqual((document.getElementById("test-case-2-select-item-3") as HTMLInputElement).value, "red");

    (document.getElementById("test-case-2-select-item-2") as HTMLInputElement).value = "green";
    if (typeof Event === "function") {
        (document.getElementById("test-case-2-select-item-2") as HTMLElement).dispatchEvent(new Event("change"));
    } else {
        // IE11 compatibility for test suite
        const ev3 = (document as any).createEvent("Event");
        ev3.initEvent("change", true, true);
        (document.getElementById("test-case-2-select-item-2") as HTMLElement).dispatchEvent(ev3 as Event);
    }

    assert.strictEqual((document.getElementById("test-case-2-select-item-1") as HTMLInputElement).value, "green");
    assert.strictEqual((document.getElementById("test-case-2-select-item-2") as HTMLInputElement).value, "green");
    assert.strictEqual((document.getElementById("test-case-2-select-item-3") as HTMLInputElement).value, "green");
});

it("Body Script Activation system is active", (done) => {
    const testFunc = () => {
        const testCase3HiddenTextMessage = (document as any).getElementById("test-case-3-hidden-text-message").innerHTML;
        assert.strictEqual(testCase3HiddenTextMessage, "Body script activation system is working!");
    };
    baseInstance.hooks.post.push(() => {
        console.log("FEF post hook from test-case-3");
        testFunc();
        done();
    });
    if (document.readyState === "complete") {
        // FrontEndFramework post hooks have already fired
        if (baseInstance.hooks.post.length > 0) {
            if (baseInstance.hooks.post.length > 1) {
                assert.ok(false, "FrontEndFramework post hooks invariant violated. GUID: 4f2a5150-79e1-4f24-9489-00f7defe98c1");
            }
            (baseInstance.hooks.post.shift() as (() => void))();
        }
    }
});

it("runtime visitLink function is present.", () => {
    assert.ok(typeof Runtime.visitLink === "function");
});
