pragma ComponentBehavior: Bound

import QtQuick
import QtQuick.Layouts
import Quickshell
import Quickshell.Bluetooth
import Caelestia.Config
import qs.components
import qs.components.controls
import qs.components.effects
import qs.services
import qs.utils
import qs.modules.nexus.common

PageBase {
    id: root

    title: qsTr("Device defaults")
    isSubPage: true

    ColumnLayout {
        anchors.horizontalCenter: parent.horizontalCenter
        anchors.top: parent.top
        width: root.cappedWidth
        spacing: Tokens.spacing.extraSmall / 2

        SectionHeader {
            first: true
            text: qsTr("Paired devices")
        }

        Repeater {
            id: deviceRepeater

            model: ScriptModel {
                values: (Bluetooth.devices.values ?? []) // qmllint disable unresolved-type
                    .filter(d => d.bonded)
                    .sort((a, b) => (b.connected - a.connected) || a.name.localeCompare(b.name))
            }

            delegate: ConnectedRect {
                id: deviceRow

                required property BluetoothDevice modelData // qmllint disable unresolved-type
                required property int index

                readonly property string bbmUrl: BbmService.deviceIconUrl(
                    deviceRow.modelData.address,
                    deviceRow.modelData.icon ?? "")

                Layout.fillWidth: true
                implicitHeight: rowContent.implicitHeight + Tokens.padding.medium * 2
                first: deviceRow.index === 0
                last: deviceRow.index === deviceRepeater.count - 1

                StateLayer {
                    onClicked: {
                        root.nState.selectedBtDevice = deviceRow.modelData;
                        root.nState.openSubPage(3);
                    }
                }

                RowLayout {
                    id: rowContent

                    anchors.left: parent.left
                    anchors.right: parent.right
                    anchors.verticalCenter: parent.verticalCenter
                    anchors.margins: Tokens.padding.largeIncreased
                    spacing: Tokens.spacing.medium

                    // Device icon — BBM SVG or Material fallback
                    Item {
                        id: iconItem

                        implicitWidth: matFallback.implicitWidth
                        implicitHeight: matFallback.implicitHeight

                        ColouredIcon {
                            anchors.centerIn: parent
                            source: deviceRow.bbmUrl
                            visible: deviceRow.bbmUrl.length > 0
                            width: matFallback.implicitWidth
                            height: matFallback.implicitHeight
                            colour: Colours.palette.m3onSurfaceVariant
                        }

                        MaterialIcon {
                            id: matFallback

                            anchors.centerIn: parent
                            // "bluetooth" used as size reference when BBM icon is active
                            text: deviceRow.bbmUrl.length > 0
                                ? "bluetooth"
                                : Icons.getDeviceIcon(deviceRow.modelData.address, deviceRow.modelData.icon ?? "")
                            visible: deviceRow.bbmUrl.length === 0
                            color: Colours.palette.m3onSurfaceVariant
                            fontStyle: Tokens.font.icon.medium
                            fill: 1
                        }
                    }

                    Column {
                        Layout.fillWidth: true
                        spacing: 0

                        StyledText {
                            anchors.left: parent.left
                            anchors.right: parent.right
                            text: deviceRow.modelData.name
                            font: Tokens.font.body.small
                            elide: Text.ElideRight
                        }

                        StyledText {
                            anchors.left: parent.left
                            anchors.right: parent.right
                            text: deviceRow.modelData.connected ? qsTr("Connected") : qsTr("Saved")
                            color: Colours.palette.m3outline
                            font: Tokens.font.label.small
                            elide: Text.ElideRight
                        }
                    }

                    MaterialIcon {
                        text: "chevron_right"
                        color: Colours.palette.m3onSurfaceVariant
                        fontStyle: Tokens.font.icon.medium
                    }
                }
            }
        }

        // Empty state
        StyledText {
            visible: deviceRepeater.count === 0
            Layout.alignment: Qt.AlignHCenter
            Layout.topMargin: Tokens.spacing.large
            text: qsTr("No paired devices")
            color: Colours.palette.m3onSurfaceVariant
            font: Tokens.font.body.small
        }
    }
}
