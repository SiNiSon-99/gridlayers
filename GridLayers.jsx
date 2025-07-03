/*
GridLayers - Adobe Photoshop Script
A script to arrange layers in a grid layout

Author: @SiNiSon-99
Version: 1.0.0
Compatible with: Adobe Photoshop 2025+
*/

function main() {
    if (app.documents.length === 0) {
        alert("Please open a document before running this script.");
        return;
    }
    
    var doc = app.activeDocument;
    
    if (doc.layers.length <= 1) {
        alert("This document needs at least 2 layers to create a grid layout.");
        return;
    }
    
    var config = showGridDialog();
    if (!config) {
        return; // User cancelled
    }
    
    try {
        app.activeDocument.suspendHistory("GridLayers", "createGridLayout(config)");
    } catch (e) {
        alert("Error creating grid layout: " + e.message);
    }
}

function showGridDialog() {
    var dialog = new Window("dialog", "GridLayers Configuration");
    dialog.orientation = "column";
    dialog.alignChildren = "fill";
    
    var dimensionsPanel = dialog.add("panel", undefined, "Grid Dimensions");
    dimensionsPanel.orientation = "row";
    dimensionsPanel.alignChildren = "left";
    
    dimensionsPanel.add("statictext", undefined, "Columns:");
    var columnsInput = dimensionsPanel.add("edittext", undefined, "3");
    columnsInput.characters = 5;
    
    dimensionsPanel.add("statictext", undefined, "Rows:");
    var rowsInput = dimensionsPanel.add("edittext", undefined, "3");
    rowsInput.characters = 5;
    
    var spacingPanel = dialog.add("panel", undefined, "Spacing");
    spacingPanel.orientation = "row";
    spacingPanel.alignChildren = "left";
    
    spacingPanel.add("statictext", undefined, "Horizontal:");
    var hSpacingInput = spacingPanel.add("edittext", undefined, "20");
    hSpacingInput.characters = 5;
    spacingPanel.add("statictext", undefined, "px");
    
    spacingPanel.add("statictext", undefined, "Vertical:");
    var vSpacingInput = spacingPanel.add("edittext", undefined, "20");
    vSpacingInput.characters = 5;
    spacingPanel.add("statictext", undefined, "px");
    
    var optionsPanel = dialog.add("panel", undefined, "Options");
    var centerGridCheckbox = optionsPanel.add("checkbox", undefined, "Center grid in document");
    centerGridCheckbox.value = true;
    
    var preserveAspectCheckbox = optionsPanel.add("checkbox", undefined, "Preserve layer aspect ratios");
    preserveAspectCheckbox.value = true;
    
    var buttonGroup = dialog.add("group");
    buttonGroup.orientation = "row";
    buttonGroup.alignment = "center";
    
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
            columns: parseInt(columnsInput.text) || 3,
            rows: parseInt(rowsInput.text) || 3,
            hSpacing: parseInt(hSpacingInput.text) || 20,
            vSpacing: parseInt(vSpacingInput.text) || 20,
            centerGrid: centerGridCheckbox.value,
            preserveAspect: preserveAspectCheckbox.value
        };
    }
    
    return null;
}

function createGridLayout(config) {
    var doc = app.activeDocument;
    var layers = getAllVisibleLayers(doc);
    
    if (layers.length === 0) {
        alert("No visible layers found to arrange.");
        return;
    }
    
    var totalCells = config.columns * config.rows;
    var layersToUse = layers.slice(0, totalCells);
    
    var docWidth = doc.width.as("px");
    var docHeight = doc.height.as("px");
    
    var totalHSpacing = (config.columns - 1) * config.hSpacing;
    var totalVSpacing = (config.rows - 1) * config.vSpacing;
    
    var cellWidth = (docWidth - totalHSpacing) / config.columns;
    var cellHeight = (docHeight - totalVSpacing) / config.rows;
    
    for (var i = 0; i < layersToUse.length; i++) {
        var layer = layersToUse[i];
        var row = Math.floor(i / config.columns);
        var col = i % config.columns;
        
        var x = col * (cellWidth + config.hSpacing);
        var y = row * (cellHeight + config.vSpacing);
        
        if (config.centerGrid) {
            x += cellWidth / 2;
            y += cellHeight / 2;
        }
        
        positionLayer(layer, x, y, cellWidth, cellHeight, config.preserveAspect);
    }
}

function getAllVisibleLayers(doc) {
    var layers = [];
    
    function collectLayers(layerSet) {
        for (var i = 0; i < layerSet.layers.length; i++) {
            var layer = layerSet.layers[i];
            
            if (layer.typename === "LayerSet") {
                collectLayers(layer);
            } else if (layer.visible && layer.typename === "ArtLayer") {
                layers.push(layer);
            }
        }
    }
    
    collectLayers(doc);
    return layers;
}

function positionLayer(layer, x, y, maxWidth, maxHeight, preserveAspect) {
    try {
        var bounds = layer.bounds;
        var layerWidth = bounds[2].as("px") - bounds[0].as("px");
        var layerHeight = bounds[3].as("px") - bounds[1].as("px");
        
        var scaleX = 1;
        var scaleY = 1;
        
        if (preserveAspect) {
            var scale = Math.min(maxWidth / layerWidth, maxHeight / layerHeight);
            scaleX = scaleY = scale;
        } else {
            scaleX = maxWidth / layerWidth;
            scaleY = maxHeight / layerHeight;
        }
        
        if (scaleX !== 1 || scaleY !== 1) {
            layer.resize(scaleX * 100, scaleY * 100, AnchorPosition.MIDDLECENTER);
        }
        
        var deltaX = x - (bounds[0].as("px") + layerWidth / 2);
        var deltaY = y - (bounds[1].as("px") + layerHeight / 2);
        
        layer.translate(UnitValue(deltaX, "px"), UnitValue(deltaY, "px"));
        
    } catch (e) {
    }
}

main();
