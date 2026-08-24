import QtQuick
import QtTest

TestCase {
    id: root

    function test_instantiates() {
        var obj = createTemporaryObject(bbmIconComp, root);
        verify(obj !== null, "BbmIcon should instantiate");
    }

    function test_default_size_18() {
        var obj = createTemporaryObject(bbmIconComp, root);
        compare(obj.size, 18);
        compare(obj.implicitWidth, 18);
        compare(obj.implicitHeight, 18);
    }

    function test_custom_size() {
        var obj = createTemporaryObject(bbmIconComp, root);
        obj.size = 32;
        compare(obj.size, 32);
        compare(obj.implicitWidth, 32);
        compare(obj.implicitHeight, 32);
    }

    function test_url_property_settable() {
        var obj = createTemporaryObject(bbmIconComp, root);
        obj.url = "file:///some/path/icon.svg";
        compare(obj.url, "file:///some/path/icon.svg");
    }

    function test_colour_property_settable() {
        var obj = createTemporaryObject(bbmIconComp, root);
        obj.colour = Qt.rgba(1, 0, 0, 1);
        // colour is a required property — just verify it doesn't crash
        verify(obj.colour !== undefined);
    }

    function test_empty_url_does_not_crash() {
        var obj = createTemporaryObject(bbmIconComp, root);
        obj.url = "";
        verify(obj !== null);
    }

    name: "BbmIcon"

    Component {
        id: bbmIconComp

        BbmIcon {
            url: ""
            colour: "white"
        }
    }
}
