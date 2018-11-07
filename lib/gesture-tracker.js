// import curry from 'ramda/src/curry';
// import pipe from 'ramda/src/pipe';
// import forOwn from 'lodash-es/forOwn';

const pipe = functions => data => {
	return functions.reduce(
		(value, func) => func(value),
		data
	);
};

const Touch = {
	isSupported: function () {
		return Boolean(('ontouchstart' in window) || window.navigator.msMaxTouchPoints);
	}
};

const inTouchMode = Touch.isSupported();

const registerListeners = spec => node => {
	Object.getOwnPropertyNames(spec).forEach(ev => {
		node.addEventListener(ev, spec[ev]);
	});
};

const getTouchData = preventDefault => ev => {
	const
		{touches} = ev,
		touch = touches ? touches[0] : ev,
		data = touch ? {x: touch.clientX, y: touch.clientY} : {};

	if (preventDefault) ev.preventDefault();

	return data;
};

const touchStart = state => touch => {
	const {x, y} = touch;

	state.moving = true;
	state.startX = state.lastX = x;
	state.startY = state.lastY = y;
	state.velocityX = state.velocityY = 0;

	return [{
		type: 'movestart'
	}]
};

const touchEnd = state => () => {
	const
		{velocityX, velocityY} = state,
		flicked = Math.abs(velocityX) > 2 || Math.abs(velocityY) > 2,
		events = [{
			type: 'moveend'
		}];

	if (flicked) {
		events.push({
			type: 'flick',
			velocityX: velocityX,
			velocityY: velocityY
		})
	}

	state.moving = false;
	state.startX = state.startY = state.lastX = state.lastY = state.velocityX = state.velocityY = null;

	return events;
};

const touchMove = state => touch => {
	const {moving} = state;
	let events;

	if (moving) {
		const
			{startX, startY, lastX, lastY} = state,
			{x, y} = touch,
			deltaX = x - startX,
			deltaY = y - startY;

		state.lastX = x;
		state.lastY = y;
		state.velocityX = x - lastX;
		state.velocityY = y - lastY;

		events = [{
			type: 'move',
			deltaX: deltaX,
			deltaY: deltaY
		}];
	}

	return events;
};

export const trackGestures = gestureProcessor => node => {
	const
		state = {},
		listeners = {},
		start = inTouchMode ? 'touchstart' : 'mousedown',
		move = inTouchMode ? 'touchmove' : 'mousemove',
		end = inTouchMode ? 'touchend' : 'mouseup',
		getTouchDataPreventDefault = getTouchData(true);

	listeners[start] = pipe([getTouchDataPreventDefault, touchStart(state), gestureProcessor]);
	listeners[move] = pipe([getTouchDataPreventDefault, touchMove(state), gestureProcessor]);
	listeners[end] = pipe([getTouchDataPreventDefault, touchEnd(state), gestureProcessor]);

	registerListeners(listeners)(node);
};