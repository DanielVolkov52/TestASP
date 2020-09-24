// ****************************************************************************
//
// Copyright (C) 2008-2014, Roman Lygin. All rights reserved.
// Copyright (C) 2014-2020, CADEX. All rights reserved.
//
// This file is part of the CAD Exchanger software.
//
// You may use this file under the terms of the BSD license as follows:
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are met:
// * Redistributions of source code must retain the above copyright notice,
//   this list of conditions and the following disclaimer.
// * Redistributions in binary form must reproduce the above copyright notice,
//   this list of conditions and the following disclaimer in the documentation
//   and/or other materials provided with the distribution.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS 'AS IS'
// AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
// IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
// ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
// LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
// CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
// SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
// INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
// CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
// ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
// POSSIBILITY OF SUCH DAMAGE.
//
// ****************************************************************************


let aModel = new cadex.ModelData_Model();

const aJSTreeConfig = {
  core: {
    multiple: true,
    check_callback: true,
    themes: {
      name: null,
      dots: true,
    }
  },
  types: {
    file: {
      icon: 'icon-file'
    },
    assembly: {
      icon: 'icon-assembly'
    },
    instance: {
      icon: 'icon-instance'
    },
    part: {
      icon: 'icon-part'
    }
  },
  plugins: ['wholerow', 'types']
};

$('#model-scenegraph').jstree(aJSTreeConfig)
  .on('select_node.jstree', (theEvent, theData) => onSelectedByTreeView(theData))
  .on('deselect_node.jstree', (theEvent, theData) => onDeselectedByTreeView(theData.node))
  .on('deselect_all.jstree', () => onDeselectedAllByTreeView());

const aJsTree = $('#model-scenegraph').jstree(true);

let aCurrentModelNode;

const aScene = new cadex.ModelPrs_Scene();
aScene.globalSelectionMode = cadex.ModelPrs_SelectionMode.Shape;
aScene.addEventListener('selectionChanged', onSelectionChangedByScene);

const aViewPort = new cadex.ModelPrs_ViewPort({
  showViewCube: true,
  cameraType: cadex.ModelPrs_CameraProjectionType.Perspective,
  autoResize: true,
}, document.getElementById('model-viewer'));

var fitAllButton = document.getElementById('fitall-button');
fitAllButton.onclick = function(){
  aViewPort.fitAll();
};

aViewPort.attachToScene(aScene);

async function loadAndDisplayModel(theModelPath, theModelName) {

  aScene.removeAll(true);

  try {
      const dataLoader = async (theModelPath, theObjId) => {
          const aRes = await fetch("/Home/GetFile?fullName=" + theModelPath + '/' + theObjId);
              
      if (aRes.status === 200) {
        return aRes.arrayBuffer();
      }
      throw new Error(aRes.statusText);
    };
    const aLoadResult = await aModel.loadFile(theModelPath, dataLoader, false);
    console.log(`${theModelPath} is loaded\n`, aLoadResult);

    aCurrentModelNode = aJsTree.create_node(null, {
      text: theModelName,
      type: 'file',
      data: {}
    });

    const aVisitor = new SceneGraphToJsTreeConverter(aCurrentModelNode, theModelPath);
    await aModel.accept(aVisitor);
    aJsTree.open_all(null, 0);

    let aDisplayMode = cadex.ModelPrs_DisplayMode.Shaded;
    let aRepMode = cadex.ModelData_RepresentationMask.ModelData_RM_Poly;

    await cadex.ModelPrs_DisplayerApplier.apply(aLoadResult.roots, [], {
      displayer: new SceneDisplayer(aScene, aCurrentModelNode),
      displayMode: aDisplayMode,
      repSelector: new cadex.ModelData_RepresentationMaskSelector(aRepMode)
    });

    aViewPort.fitAll();
  }
  catch (theErr) {
    console.log('Unable to load and display model: ', theErr);
    alert(`Unable to load model "${theModelPath}" [${theErr.message}]`);
  }
}

class SceneDisplayer extends cadex.ModelPrs_Displayer {

  constructor(theScene, theFileNodeId) {
    super();
    this.scene = theScene;
    this.fileNode = aJsTree.get_node(theFileNodeId);
  }

  display(theView3dObjects, theRepresentation, theAncestors, theDisplayMode) {
    if (!theView3dObjects) {
      return;
    }
    this.scene.display(theView3dObjects, theDisplayMode);

    let currentJsTreNode = this.fileNode;
    for (let i = 0; i < theAncestors.length; i++) {
      const aCurrentSGE = theAncestors[i];
      let aFound = false;
      for (const aChildrenId of currentJsTreNode.children) {
        const aNode = aJsTree.get_node(aChildrenId);
        if (aNode.data.sge === aCurrentSGE) {
          currentJsTreNode = aNode;
          aFound = true;
          if (aCurrentSGE instanceof cadex.ModelData_Instance) {
            i++;
            if (aCurrentSGE.reference !== theAncestors[i]) {
              aFound = false;
            }
          }
          break;
        }
      }
      if (!aFound) {
        console.error('Unable to find tree view node by path', theAncestors);
        return;
      }
    }
    currentJsTreNode.data.view3dObjects = theView3dObjects;
    theView3dObjects.forEach(theObj => {
      theObj.treeId = currentJsTreNode.id;
    });
  }

}

class SceneGraphToJsTreeConverter extends cadex.ModelData_SceneGraphElementVisitor {

  constructor(theRootNode) {
    super();
    this.jsTreeNodes = [theRootNode];
    this.lastInstance = null;
  }
  currentNode() {
    return this.jsTreeNodes[this.jsTreeNodes.length - 1];
  }

  visitPart(thePart) {
    const aTreeItem = {
      text: (this.lastInstance && this.lastInstance.name) || thePart.name || 'Unnamed Part',
      type: 'part',
      data: {
        sge: this.lastInstance || thePart
      }
    };
    const aNode = aJsTree.create_node(this.currentNode(), aTreeItem);
  }

  visitInstanceEnter(theInstance) {
    this.lastInstance = theInstance;
    return true;
  }

  visitInstanceLeave() {
    this.lastInstance = null;
  }

  visitAssemblyEnter(theAssembly) {
    const aTreeItem = {
      text: (this.lastInstance && this.lastInstance.name) || theAssembly.name || 'Unnamed Assembly',
      type: 'assembly',
      data: {
        sge: this.lastInstance || theAssembly
      }
    };
    const aNode = aJsTree.create_node(this.currentNode(), aTreeItem);
    this.jsTreeNodes.push(aNode);
    return true;
  }

  visitAssemblyLeave() {
    this.jsTreeNodes.pop();
  }

}

function onSelectionChangedByScene(theEvent) {
  theEvent.added.forEach((theAdded => {
    const anAddedObject = theAdded.object;
    if (anAddedObject.treeId) {
      aJsTree.select_node(anAddedObject.treeId);
    }
  }));
  theEvent.removed.forEach((theRemoved => {
    const aRemovedObject = theRemoved.object;
    if (aRemovedObject.treeId) {
      aJsTree.deselect_node(aRemovedObject.treeId);
    }
  }));
}

function collectLeaves(theNode) {
  if (theNode.children.length === 0) {
    return [theNode];
  } else {
    return theNode.children_d.reduce((theLeaves, theChildId) => {
      const aChild = aJsTree.get_node(theChildId);
      if (aChild.children.length === 0) {
        theLeaves.push(aChild);
      }
      return theLeaves;
    }, []);
  }
}

function onSelectedByTreeView(theData) {
    document.getElementById('VPText').style.visibility = 'hidden';
    document.getElementById('VPLoading').style.visibility = 'visible';
    collectLeaves(theData.node).forEach(theLeaf => {
        if (theLeaf.data.view3dObjects) {
            aScene.select(theLeaf.data.view3dObjects, false, false);
        }
    });
    theParents = [];
    node = theData.node;
    while (node.parent != '#') {
        theParents.push(node.data.sge.uuid);
        node = theData.instance.get_node(node.parent)
    }
    if (theParents.length != 0) {

        var aRequest = new XMLHttpRequest();
        aRequest.open('post', '/Home/GetValidationProp', true);
        var dat = JSON.stringify(theParents);
        console.log(dat);
        aRequest.setRequestHeader('Content-Type', 'application/json;charset=utf-8');
        aRequest.responseType = "json";
        aRequest.send(dat);
        aRequest.onreadystatechange = function () {
            if (aRequest.status == 200) {
                var vProp = aRequest.response;
                changeValue('SurfaceArea', vProp.SurfaceArea);
                changeValue('Volume', vProp.Volume);
                changeValue('Centroid', vProp.Centroid);
                document.getElementById('VPText').style.visibility = 'hidden';
                document.getElementById('VPTable').style.visibility = 'visible';
                document.getElementById('VPLoading').style.visibility = 'hidden';
            } else {
                alert("Oops something went wrong...");
                document.getElementById('VPText').style.visibility = 'visible';
                document.getElementById('VPTable').style.visibility = 'hidden';
                document.getElementById('VPLoading').style.visibility = 'hidden';
            }
        }

    } else {
        document.getElementById('VPText').style.visibility = 'visible';
        document.getElementById('VPLoading').style.visibility = 'hidden';
    }
    


}

function changeValue(theName, theValue) {
    var aCell = document.querySelector('#' + theName + ' td.value')
    aCell.innerHTML = theValue;
}

function onDeselectedByTreeView(theNode) {
  collectLeaves(theNode).forEach(theLeaf => {
    if (theLeaf.data.view3dObjects) {
      aScene.deselect(theLeaf.data.view3dObjects);
    }
  });
    document.getElementById('VPText').style.visibility = 'visible';
    document.getElementById('VPTable').style.visibility = 'hidden';
}

function onDeselectedAllByTreeView() {
    aScene.deselectAll();
    document.getElementById('VPText').style.visibility = 'visible';
    document.getElementById('VPTable').style.visibility = 'hidden';
}

