module.exports = [{
	name: 'test',
	autocomplete: true,
	fields: [{
		name: 'uname',
		placeholder: 'uname',
		type: 'text',
		required: true
	}, {
		name: 'phone',
		placeholder: 'phone',
		type: 'tel',
		value: 'phone',
		required: true
	}, {
		name: 'email',
		type: 'email',
		value: 'email'
	}, {
		name: 'currency',
		type: 'select',
		options: [{
			value: 1,
			text: 'UAH'
		}, {
			selected: true,
			value: 2,
			text: 'USD'
		}, {
			value: 3,
			text: 'EUR'
		}]
	}]
}];