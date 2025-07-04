#target photoshop

/*
GridLayers - Adobe Photoshop Script
A script to arrange layers in a grid layout

Author: @SiNiSon-99
Version: 1.1.0
Compatible with: Adobe Photoshop 2025+
*/

var DEFAULT_COLUMNS = 5;
var DEFAULT_PADDING = 20;
var DEFAULT_TEXT_HEIGHT = 30;

function main() {
    if (app.documents.length === 0) {
        alert("Please open a document before running this script.");
        return;
    }

    var doc = app.activeDocument;

    if (doc.layers.length === 0) {
        alert("This document needs at least 1 layer to create a grid layout.");
        return;
    }

    var config = showGridDialog();
    if (!config) {
        return; // User cancelled
    }

    try {
        createGridLayout(config);
    } catch (e) {
        alert("Error creating grid layout: " + e.message);
    }
}

function showGridDialog() {
    var dialog = new Window("dialog", "GridLayers Configuration");
    dialog.orientation = "column";
    dialog.alignChildren = "fill";
    dialog.spacing = 10;
    dialog.margins = 16;

    var dimensionsPanel = dialog.add("panel", undefined, "Grid Dimensions");
    dimensionsPanel.orientation = "column";
    dimensionsPanel.alignChildren = "fill";
    dimensionsPanel.spacing = 10;
    dimensionsPanel.margins = 10;

    var colRow = dimensionsPanel.add("group");
    colRow.add("statictext", undefined, "Columns:");
    var columnsInput = colRow.add("edittext", undefined, DEFAULT_COLUMNS.toString());
    columnsInput.characters = 5;

    var spacingPanel = dialog.add("panel", undefined, "Spacing & Layout");
    spacingPanel.orientation = "column";
    spacingPanel.alignChildren = "fill";
    spacingPanel.spacing = 10;
    spacingPanel.margins = 10;

    var paddingRow = spacingPanel.add("group");
    paddingRow.add("statictext", undefined, "Padding:");
    var paddingInput = paddingRow.add("edittext", undefined, DEFAULT_PADDING.toString());
    paddingInput.characters = 5;
    paddingRow.add("statictext", undefined, "px");

    var textHeightRow = spacingPanel.add("group");
    textHeightRow.add("statictext", undefined, "Text Height:");
    var textHeightInput = textHeightRow.add("edittext", undefined, DEFAULT_TEXT_HEIGHT.toString());
    textHeightInput.characters = 5;
    textHeightRow.add("statictext", undefined, "px");

    var optionsPanel = dialog.add("panel", undefined, "Options");
    optionsPanel.orientation = "column";
    optionsPanel.alignChildren = "fill";
    optionsPanel.spacing = 5;
    optionsPanel.margins = 10;

    var duplicateDocCheckbox = optionsPanel.add("checkbox", undefined, "Create new document for grid");
    duplicateDocCheckbox.value = true;

    var addLabelsCheckbox = optionsPanel.add("checkbox", undefined, "Add layer name labels");
    addLabelsCheckbox.value = true;

    var visibleOnlyCheckbox = optionsPanel.add("checkbox", undefined, "Use visible layers only");
    visibleOnlyCheckbox.value = true;

    var buttonGroup = dialog.add("group");
    buttonGroup.orientation = "row";
    buttonGroup.alignment = "center";
    buttonGroup.spacing = 10;

    var cancelButton = buttonGroup.add("button", undefined, "Cancel");
    var okButton = buttonGroup.add("button", undefined, "Apply");

    cancelButton.onClick = function() {
        dialog.close();
    };

    okButton.onClick = function() {
        dialog.close(1);
    };

    if (dialog.show() === 1) {
        return {
            columns: parseInt(columnsInput.text) || DEFAULT_COLUMNS,
            padding: parseInt(paddingInput.text) || DEFAULT_PADDING,
            textHeight: parseInt(textHeightInput.text) || DEFAULT_TEXT_HEIGHT,
            duplicateDoc: duplicateDocCheckbox.value,
            addLabels: addLabelsCheckbox.value,
            visibleOnly: visibleOnlyCheckbox.value
        };
    }

    return null;
}

function createGridLayout(config) {
    var doc = app.activeDocument;
    var layers = [];

    for (var i = 0; i < doc.layers.length; i++) {
        var layer = doc.layers[i];
        if (!layer.isBackgroundLayer && !layer.grouped && layer.kind !== LayerKind.TEXT) {
            if (!config.visibleOnly || layer.visible) {
                layers.push(layer);
            }
        }
    }

    if (layers.length === 0) {
        alert("No suitable layers found (must be visible, non-text, top-level).");
        return;
    }

    var workingDoc = doc;
    if (config.duplicateDoc) {
        workingDoc = doc.duplicate("Grid Output", false);
        app.activeDocument = workingDoc;

        layers = [];
        for (var i = 0; i < workingDoc.layers.length; i++) {
            var layer = workingDoc.layers[i];
            if (!layer.isBackgroundLayer && !layer.grouped && layer.kind !== LayerKind.TEXT) {
                if (!config.visibleOnly || layer.visible) {
                    layers.push(layer);
                }
            }
        }
    }

    if (layers.length === 0) {
        alert("No layers found in working document.");
        return;
    }

    var firstLayer = layers[0];
    var layerBounds = getLayerBounds(firstLayer);
    if (!layerBounds) {
        alert("Could not get bounds for layer: " + firstLayer.name);
        return;
    }

    var layerWidth = layerBounds.width;
    var layerHeight = layerBounds.height;

    // Calculate grid layout
    var rows = Math.ceil(layers.length / config.columns);
    var canvasW = config.columns * (layerWidth + config.padding) - config.padding;
    var canvasH = rows * (layerHeight + (config.addLabels ? config.textHeight : 0) + config.padding) - config.padding;

    try {
        workingDoc.resizeCanvas(UnitValue(canvasW, "px"), UnitValue(canvasH, "px"), AnchorPosition.TOPLEFT);
    } catch (e) {
        alert("Error resizing canvas: " + e.message);
        return;
    }

    for (var i = 0; i < layers.length; i++) {
        var layer = layers[layers.length - 1 - i]; // Reverse the order
        var col = i % config.columns;
        var row = Math.floor(i / config.columns);

        var x = col * (layerWidth + config.padding);
        var y = row * (layerHeight + (config.addLabels ? config.textHeight : 0) + config.padding);

        try {
            moveLayerToPosition(layer, x, y);

            if (config.addLabels) {
                addLayerLabel(workingDoc, layer.name, x, y, layerWidth, layerHeight);
            }

        } catch (e) {
            alert("Error positioning layer '" + layer.name + "': " + e.message);
        }
    }

    alert("Grid layout complete! " + layers.length + " layers arranged in " + config.columns + "x" + rows + " grid.");
}

function getLayerBounds(layer) {
    try {
        var bounds = layer.bounds;
        return {
            left: bounds[0].as("px"),
            top: bounds[1].as("px"),
            right: bounds[2].as("px"),
            bottom: bounds[3].as("px"),
            width: bounds[2].as("px") - bounds[0].as("px"),
            height: bounds[3].as("px") - bounds[1].as("px")
        };
    } catch (e) {
        return null;
    }
}

function moveLayerToPosition(layer, x, y) {
    try {
        var bounds = layer.bounds;
        var currentX = bounds[0].as("px");
        var currentY = bounds[1].as("px");

        var deltaX = x - currentX;
        var deltaY = y - currentY;

        layer.translate(UnitValue(deltaX, "px"), UnitValue(deltaY, "px"));
    } catch (e) {
        throw new Error("Failed to move layer: " + e.message);
    }
}

function addLayerLabel(doc, labelText, x, y, layerWidth, layerHeight) {
    try {
        var textLayer = doc.artLayers.add();
        textLayer.kind = LayerKind.TEXT;
        textLayer.name = "Label: " + labelText;

        var textItem = textLayer.textItem;
        textItem.contents = labelText;
        
        // Calculate text size as 10% of layer height
        var textSize = Math.max(8, layerHeight * 0.1); // Minimum 8px for readability
        textItem.size = UnitValue(textSize, "px");
        
        textItem.font = "Arial-BoldMT";
        
        var textY = y - textSize - 5; // 5px above the layer
        
        var centerX = x + (layerWidth / 2);
        textItem.position = [UnitValue(centerX, "px"), UnitValue(textY, "px")];
        
        textItem.justification = Justification.CENTER;

        var textColor = new SolidColor();
        textColor.rgb.red = 255;
        textColor.rgb.green = 255;
        textColor.rgb.blue = 0;
        textItem.color = textColor;

    } catch (e) {
        alert("Error creating text label: " + e.message);
    }
}

main();
