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

	if (!inTouchMode) {
		document.addEventListener('mousemove', state.move);
		document.addEventListener('mouseup', state.end);
	}

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

	if (!inTouchMode) {
		document.removeEventListener('mousemove', state.move);
		document.removeEventListener('mouseup', state.end);
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
		getTouchDataPreventDefault = getTouchData(true),
		start = pipe([getTouchDataPreventDefault, touchStart(state), gestureProcessor]),
		move = pipe([getTouchDataPreventDefault, touchMove(state), gestureProcessor]),
		end = pipe([getTouchDataPreventDefault, touchEnd(state), gestureProcessor]);
	
	Object.assign(state, { start, move, end });
	
	if (inTouchMode) {
		node.addEventListener('touchstart', state.start);
		node.addEventListener('touchmove', state.move);
		node.addEventListener('touchend', state.end);
	}
	else {
		node.addEventListener('mousedown', state.start);
	}
};