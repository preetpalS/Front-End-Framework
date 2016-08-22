
QUnit.test("adder basics", function(assert) {
    var add5 = FrontEndFramework.adder(5);
    assert.equal(10, add5(5));
});
