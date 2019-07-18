import React from 'react';
import Select from 'react-select';

const xhr = require('xhr');
const assign = require('object-assign');

import ItemsTableCell from '../../components/ItemsTableCell';
// import ItemsTableValue from '../../components/ItemsTableValue';


var SelectColumn = React.createClass({
	displayName: 'SelectColumn',
	propTypes: {
		col: React.PropTypes.object,
		data: React.PropTypes.object,
		linkTo: React.PropTypes.string,
	},
	getValue() {
		const value = this.props.data.fields[this.props.col.path];
		const option = this.props.col.field.ops.filter(i => i.value === value)[0];

		return option ? option.label : null;
	},
	valueChanged(newValue) {
		// TODO: This should be natively handled by the Select component
		if (this.props.numeric && typeof newValue === 'string') {
			newValue = newValue ? Number(newValue) : undefined;
		}

		const formData = new FormData();
		formData.append(this.props.col.path, newValue);

		const _parent = this;

		this.updateItem(formData, function (err, result) {

			if (err) return console.error(err);

			_parent.props.data.fields.state = newValue;
			_parent.setState({
				data: {
					field: {
						state: newValue
					}
				}
			});
			_parent.renderValue();
		})

	},

	getId() {
		return this.props.data.id;
	},

	getPath() {
		return this.props.list.id;
	},

	updateItem(formData, cb) {

		this.setState({
			loading: true,
		});


		const postUrl = `${Keystone.adminPath}/api/${this.getPath()}/${this.getId()}`;
		console.log(postUrl)
		xhr({
			url: postUrl,
			responseType: 'json',
			method: 'POST',
			headers: assign({}, Keystone.csrf.header),
			body: formData,
		}, (err, resp, data) => {
			if (err) return cb(err);
			if (resp.statusCode === 200) {
				cb(null, data);
			} else {
				cb(data);
			}
		});
	},
	getInputName(path) {
		// This correctly creates the path for field inputs, and supports the
		// inputNamePrefix prop that is required for nested fields to work
		return this.props.inputNamePrefix
			? `${this.props.inputNamePrefix}[${path}]`
			: path;
	},
	renderValue() {

		const {numeric, ops, path, required} = this.props.col.field;

		const val = this.props.data.fields.state;

		const clearable = !required;

		// TODO: This should be natively handled by the Select component

		const options = (numeric)
			? ops.map(function (i) {
				return {label: i.label, value: String(i.value)};
			})
			: ops;
		const value = (typeof val === 'number')
			? String(val)
			: val;


		return (
			<div>
				<input type="text" style={{position: 'absolute', width: 1, height: 1, zIndex: -1, opacity: 0}} tabIndex="-1"/>
				<Select
					simpleValue
					name={this.getInputName(path)}
					clearable={clearable}
					value={value}
					options={options}
					onChange={this.valueChanged}
				/>
			</div>
		);
	},
	render() {
		return (
			<ItemsTableCell>
				{this.renderValue()}
			</ItemsTableCell>
		);
	},
});

module.exports = SelectColumn;
