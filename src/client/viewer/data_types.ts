// useful links
// https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events
// https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent
// https://developer.mozilla.org/en-US/docs/Web/API/Touch_events

/**
 * Possible button values returned by {@link https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events | PointerEvent.button}
 */
 export enum PointerEventButtonIDs {
    NONE = -1,
    PRIMARY,
    AUXILARY,
    SECONDARY,
    BACK,
    FORWARD,
    ERASE,

    NUM_VALUES = 7
}

/**
 * Mapping of bitfield in {@link https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events | PointerEvent.buttons}
 */
export enum PointerEventButtonsMask {
    NONE = 0,
    PRIMARY = 1,
    SECONDARY = 2,
    AUXILARY = 4,
    BACK = 8,
    FORWARD = 16,
    ERASE = 32,

    NUM_VALUES = 7
}

export enum PointerEventType {
    PRIMARY_CLICK = "onPrimaryClick",
    SECONDARY_CLICK = "onSecondaryClick",
    PRIMARY_DOUBLE_CLICK = "onPrimaryDoubleClick",
    SECONDARY_DOUBLE_CLICK = "onSecondaryDOubleClick",
    PRIMARY_LONG_CLICK = "onPrimaryLongClick",
    SECONDARY_LONG_CLICK = "onSecondaryLongClick",
    AUXILARY_CLICK = "onAuxilaryClick",
    AUXILARY_DOUBLE_CLICK = "onAuxilaryDOubleClick",
    AUXILARY_LONG_CLICK = "onAuxilaryLongClick",
    PRIMARY_START_DRAG = "onPrimaryStartDrag",
    SECONDARY_START_DRAG = "onSecondaryStartDrag",
    AUXILARY_START_DRAG = "onAuxilaryStartDrag",
    PRIMARY_DRAGGED = "onPrimaryDragged",
    SECONDARY_DRAGGED = "onSecondaryDragged",
    AUXILARY_DRAGGED = "onAuxilaryDragged",
    PRIMARY_END_DRAG = "onPrimaryEndDrag",
    SECONDARY_END_DRAG = "onSecondaryEndDrag",
    AUXILARY_END_DRAG = "onAuxilaryEndDrag",
    HOVER = "onHover",
    PRIMARY_DOWN = "onPrimaryDown",
    SECONDARY_DOWN = "onSecondaryDown",
    AUXILARY_DOWN = "onAuxilaryDown",
    PRIMARY_MOVED = "onPrimaryMoved",
    SECONDARY_MOVED = "onSecondaryMoved",
    AUXILARY_MOVED = "onAuxilaryMoved",
    PRIMARY_UP = "onPrimaryUp",
    SECONDARY_UP = "onSecondaryUp",
    AUXILARY_UP = "onAuxilaryUp",
    POINTER_ENTER = "onPointerEnter",
    POINTER_LEAVE = "onPointerLeave",
    POINTER_OUT = "onPointerOut",
    ESC_DOWN = "onEscDown",
    NONE = "none"
}

export enum GestureType {
    PINCH = "onPinch",
    SWIPE = "onSwipe"
}