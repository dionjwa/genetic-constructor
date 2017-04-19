/*
Copyright 2016 Autodesk,Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
import invariant from 'invariant';

/**
 * sort blocks according to the position in the
 * parent construct AND their level of nesting.
 * Blocks higher in the resulting list are further from the root of
 * the construct. Blocks at greater depths of nesting are
 * always considered lower than blocks in the parent hierarchy.
 * e.g. given this arrangement of blocks, with selected ones
 * denoted by letters....
 * [ F ][ A ][ - ][ C ][ - ]
 *        |
 *      [ B ][ - ][ D ]
 *             |
 *           [ E ]
 *
 * After sorting the block [A..E] the order would be:
 * [F, E, B, D, A, C]
 */
export function sortBlocksByIndexAndDepth(construct, blocks, blockIds, excludeChildrenOfSelectedBlocks = false) {
  // simplest way is to walk the construct, depth first
  // and add the block ids to a new array in the order they are discovered
  const ordered = [];
  const candidates = blockIds.slice();
  const walk = (blockId, parentSelected = false) => {
    const index = candidates.indexOf(blockId);
    if (index >= 0) {
      if (!(excludeChildrenOfSelectedBlocks && parentSelected)) {
        ordered.push(blockId);
        candidates.splice(index, 1);
      }
    }
    invariant(blocks[blockId], 'expected to find the block');
    blocks[blockId].components.forEach(blockId => walk(blockId, parentSelected || index >= 0));
  };
  walk(construct.id);
  return ordered;
}

/**
 * clear any selected text in the entire document
 */
export function clearSelection() {
  let selection = null;
  if (window.getSelection) {
    selection = window.getSelection();
  } else if (document.selection) {
    selection = document.selection;
  }
  if (selection) {
    if (selection.empty) {
      selection.empty();
    }
    if (selection.removeAllRanges) {
      selection.removeAllRanges();
    }
  }
}

/**
 * calculate the total number of each tag type in the DOM and the classes assigned.
 * List them all sorted to show which are most common. Very useful if you are
 * investigating a DOM leak.
 */
export function domSummary() {
  // let tags = {};
  // let classes = {};
  // [...document.querySelectorAll('*')].forEach(element => {
  //   const tagName = element.tagName;
  //   if (tags[tagName]) {
  //     tags[tagName].count += 1;
  //   } else {
  //     tags[tagName] = {tagName, count: 1};
  //   }
  //   element.classList.forEach(className => {
  //     if (className) {
  //       if (classes[className]) {
  //         classes[className].count += 1;
  //       } else {
  //         classes[className] = {className, count: 1};
  //       }
  //     }
  //   });
  // });
  // // turn into arrays
  // tags = Object.keys(tags).map(tagName => tags[tagName]);
  // classes = Object.keys(classes).map(className => classes[className]);
  //
  // // sort highest first
  // tags.sort((aaa, bbb) => { return bbb.count - aaa.count; });
  // classes.sort((aaa, bbb) => { return bbb.count - aaa.count; });
  //
  // console.log('DOM Summary: ==============');
  // console.log('Tags: ---------------------')
  // tags.forEach(tagInfo => {
  //   console.log(`${tagInfo.tagName} / Count: ${tagInfo.count}`);
  // });
  // console.log('Classes: ------------------')
  // classes.forEach(classInfo => {
  //   console.log(`${classInfo.className} / Count: ${classInfo.count}`);
  // });
}
