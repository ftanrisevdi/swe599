//these codes are insprired by https://javascript.info/mouse-drag-and-drop

let targets;
let items;
//object for storing the selections data
//comprising an array of the currently selected items
//a reference to the selected items' owning container
//and a refernce to the current drop target container
const selections = {
  items: [],
  owner: null,
  droptarget: null,
};
//related variable is needed to maintain a reference to the
//dragleave's relatedTarget, since it doesn't have e.relatedTarget
let related = null;
const addSelection = (item) => {
  //if the owner reference is still null, set it to this item's parent
  //so that further selection is only allowed within the same container
  if (!selections.owner) {
    selections.owner = item.parentNode;
  }

  //or if that's already happened then compare it with this item's parent
  //and if they're not the same container, return to prevent selection
  else if (selections.owner != item.parentNode) {
    return;
  }

  //set this item's grabbed state
  item.setAttribute("aria-grabbed", "true");

  //add it to the items array
  selections.items.push(item);
};
const removeSelection = (item) => {
  //reset this item's grabbed state
  item.setAttribute("aria-grabbed", "false");

  //then find and remove this item from the existing items array
  for (let len = selections.items.length, i = 0; i < len; i++) {
    if (selections.items[i] == item) {
      selections.items.splice(i, 1);
      break;
    }
  }
};
const clearSelections = () => {
  //if we have any selected items
  if (selections.items.length) {
    //reset the owner reference
    selections.owner = null;

    //reset the grabbed state on every selected item
    for (let i = 0; i < selections.items.length; i++) {
      selections.items[i].setAttribute("aria-grabbed", "false");
    }

    //then reset the items array
    selections.items = [];
  }
};
const addDropeffects = () => {
  //apply aria-dropeffect and tabindex to all targets apart from the owner
  for (let i = 0; i < targets.length; i++) {
    if (
      targets[i] != selections.owner &&
      targets[i].getAttribute("aria-dropeffect") == "none"
    ) {
      targets[i].setAttribute("aria-dropeffect", "move");
      targets[i].setAttribute("tabindex", "0");
    }
  }

  //remove aria-grabbed and tabindex from all items inside those containers
  for (let i = 0; i < items.length; i++) {
    if (
      items[i].parentNode != selections.owner &&
      items[i].getAttribute("aria-grabbed")
    ) {
      items[i].removeAttribute("aria-grabbed");
      items[i].removeAttribute("tabindex");
    }
  }
};
const clearDropeffects = () => {
  //if we have any selected items
  if (selections.items.length) {
    //reset aria-dropeffect and remove tabindex from all targets
    for (let i = 0; i < targets.length; i++) {
      if (targets[i].getAttribute("aria-dropeffect") != "none") {
        targets[i].setAttribute("aria-dropeffect", "none");
        targets[i].removeAttribute("tabindex");
      }
    }

    //restore aria-grabbed and tabindex to all selectable items
    //without changing the grabbed value of any existing selected items
    for (let i = 0; i < items.length; i++) {
      if (!items[i].getAttribute("aria-grabbed")) {
        items[i].setAttribute("aria-grabbed", "false");
        items[i].setAttribute("tabindex", "0");
      } else if (items[i].getAttribute("aria-grabbed") == "true") {
        items[i].setAttribute("tabindex", "0");
      }
    }
  }
};
const getContainer = (element) => {
  do {
    if (element.nodeType == 1 && element.getAttribute("aria-dropeffect")) {
      return element;
    }
  } while ((element = element.parentNode));

  return null;
};
const mouseDownFunc = (e) => {
  let dom = e.target;
  if (dom.parentElement.getAttribute("draggable")) {
    dom = dom.parentElement;
  }
  //if the element is a draggable item
  if (
    dom.getAttribute("draggable") ||
    dom.parentElement.getAttribute("draggable")
  ) {
    //clear dropeffect from the target containers
    clearDropeffects();

    //if the multiple selection modifier is not pressed
    //and the item's grabbed state is currently false
    if (dom.getAttribute("aria-grabbed") == "false") {
      //clear all existing selections
      clearSelections();

      //then add this new selection
      addSelection(dom);
    }
  }
  //else [if the element is anything else and the modifier is pressed]
  else {
    //clear dropeffect from the target containers
    clearDropeffects();
  }
};
const mouseUpFunc = (e) => {
  //if the element is a draggable item
  //and the multipler selection modifier is pressed
  if (e.target.getAttribute("draggable")) {
    //if the item's grabbed state is currently true
    if (e.target.getAttribute("aria-grabbed") == "true") {
      //unselect this item
      removeSelection(e.target);

      //if that was the only selected item
      //then reset the owner container reference
      if (!selections.items.length) {
        selections.owner = null;
      }
    }

    //else [if the item's grabbed state is false]
    else {
      //add this additional selection
      addSelection(e.target);
    }
  }
};
const dragStartFunc = (e) => {
  //if the element's parent is not the owner, then block this event
  if (selections.owner != e.target.parentNode) {
    e.preventDefault();
    return;
  }

  //[else] if the multiple selection modifier is pressed
  //and the item's grabbed state is currently false
  if (e.target.getAttribute("aria-grabbed") == "false") {
    //add this additional selection
    addSelection(e.target);
  }

  //we don't need the transfer data, but we have to define something
  //otherwise the drop action won't work at all in firefox
  //most browsers support the proper mime-type syntax, eg. "text/plain"
  //but we have to use this incorrect syntax for the benefit of IE10+
  e.dataTransfer.setData("text", "");

  //apply dropeffect to the target containers
  addDropeffects();
};
const dragEnterFunc = (e) => {
  related = e.target;
};
const dragleaveFunc = (e) => {
  //get a drop target reference from the relatedTarget
  let droptarget = getContainer(related);

  //if the target is the owner then it's not a valid drop target
  if (droptarget == selections.owner) {
    droptarget = null;
  }

  //if the drop target is different from the last stored reference
  //(or we have one of those references but not the other one)
  if (droptarget != selections.droptarget) {
    //if we have a saved reference, clear its existing dragover class
    if (selections.droptarget) {
      selections.droptarget.className = selections.droptarget.className.replace(
        / dragover/g,
        ""
      );
    }

    //apply the dragover class to the new drop target reference
    if (droptarget) {
      droptarget.className += " dragover";
    }

    //then save that reference for next time
    selections.droptarget = droptarget;
  }
};
const dragOverFunc = (e) => {
  if (selections.items.length) {
    e.preventDefault();
  }
};
const dragEndFunc = (e) => {
  if (selections.droptarget) {
    //append the selected items to the end of the target container
    for (let i = 0; i < selections.items.length; i++) {
      selections.droptarget.appendChild(selections.items[i]);
    }

    //prevent default to allow the action
    e.preventDefault();
  }

  //if we have any selected items
  if (selections.items.length) {
    //clear dropeffect from the target containers
    clearDropeffects();

    //if we have a valid drop target reference
    if (selections.droptarget) {
      //reset the selections array
      clearSelections();

      //reset the target's dragover class
      selections.droptarget.className = selections.droptarget.className.replace(
        / dragover/g,
        ""
      );

      //reset the target reference
      selections.droptarget = null;
    }
  }
  calculate();
};
const calculate = () => {
  const scaleLeft = document.getElementById("scale-left");
  const weightLeft = scaleLeft.querySelectorAll(".weight");
  let left = 0;
  for (let i = 0; i < weightLeft.length; i++) {
    left = left + parseInt(weightLeft[i].dataset.number);
  }
  const scaleRight = document.getElementById("scale-right");
  const weightRight = scaleRight.querySelectorAll(".weight");
  let right = 0;
  for (let i = 0; i < weightRight.length; i++) {
    right = right + parseInt(weightRight[i].dataset.number);
  }

  const scale = document.querySelectorAll(".svg-container");
  for (let i = 0; i < scale.length; i++) {
    scale[i].removeAttribute("style");
  }
  document.getElementById("scale-left").classList.remove("heavy", "light");
  document.getElementById("scale-right").classList.remove("heavy", "light");

  if (left > right) {
    document
      .getElementById("off-balanced-left")
      .setAttribute("style", "display:block");
    document.getElementById("scale-left").classList.add("heavy");
    document.getElementById("scale-right").classList.add("light");
  } else if (left < right) {
    document
      .getElementById("off-balanced-right")
      .setAttribute("style", "display:block");
    document.getElementById("scale-right").classList.add("heavy");
    document.getElementById("scale-left").classList.add("light");
  } else if (left === right) {
    document.getElementById("balanced").setAttribute("style", "display:block");
  }
};
const createWeight = (weight, className) => {
  return `<span data-number="${weight}"  data-draggable="item" class="draggable weight size-${weight} ${className}">
    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
      <path fill="none" stroke="black" d="M 2.5 13.5 L 4.5 4.5 L 11.5 4.5 L 13.5 13.5 L 2.5 13.5 Z" />
      <rect fill="none" stroke="black" x="6.5" y="2.5" width="3" height="2" rx="1" />
    </svg>
    <span class="number">${weight}</span>
  </span>`;
};
const dragDropInit = () => {
  //get the collection of draggable targets and add their draggable attribute
  targets = document.querySelectorAll('[data-draggable="target"]');
  //get the collection of draggable items and add their draggable attributes
  items = document.querySelectorAll('[data-draggable="item"]');
  for (let i = 0; i < items.length; i++) {
    items[i].setAttribute("draggable", "true");
    items[i].setAttribute("aria-grabbed", "false");
    items[i].setAttribute("tabindex", "0");
  }

  for (let i = 0; i < targets.length; i++) {
    targets[i].setAttribute("aria-dropeffect", "none");
  }
  document.addEventListener("mousedown", mouseDownFunc, false);
  document.addEventListener("mouseup", mouseUpFunc, false);
  document.addEventListener("dragstart", dragStartFunc, false);
  document.addEventListener("dragenter", dragEnterFunc, false);
  document.addEventListener("dragleave", dragleaveFunc, false);
  document.addEventListener("dragover", dragOverFunc, false);
  document.addEventListener("dragend", dragEndFunc, false);
};
