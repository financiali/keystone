import React from 'react';
import Select from 'react-select';

const xhr = require('xhr');
const assign = require('object-assign');

import ItemsTableCell from '../../components/ItemsTableCell';
import {Button} from "../../../admin/client/App/elemental";
// import ItemsTableValue from '../../components/ItemsTableValue';
import ConfirmationDialog from '../../../admin/client/App/shared/ConfirmationDialog';

var SelectColumn = React.createClass({
	displayName: 'SelectColumn',
	propTypes: {
		col: React.PropTypes.object,
		data: React.PropTypes.object,
		linkTo: React.PropTypes.string,
	},
	getInitialState() {
		return {
			loading: false,
			show_options: false,
			state_confirm: null
		};
	},

	getValue() {
		const value = this.props.data.fields[this.props.col.path];
		const option = this.props.col.field.ops.filter(i => i.value === value)[0];

		return option ? option.label : null;
	},
	valueChanged2(newValue) {
		this.setState({
			state_confirm: newValue,
		});
	},
	valueChanged() {

		var newValue = this.state.state_confirm;
		// TODO: This should be natively handled by the Select component
		if (this.props.numeric && typeof newValue === 'string') {
			newValue = newValue ? Number(newValue) : undefined;
		}

		const formData = new FormData();
		formData.append(this.props.col.path, newValue);

		const _parent = this;

		this.updateItem(formData, function (err, result) {

			if (err) {
				alert('Error: ' + err.error);
				return err;
			}

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

		var _self = this;

		const postUrl = `${Keystone.adminPath}/api/${this.getPath()}/${this.getId()}`;
		xhr({
			url: postUrl,
			responseType: 'json',
			method: 'POST',
			headers: assign({}, Keystone.csrf.header),
			body: formData,
		}, (err, resp, data) => {
			if (err) return cb(err);
			_self.setState({
				show_options: false,
			});
			if (resp.statusCode === 200) {
				cb(null, data);
			} else {
				cb(data);
			}
			this.toggleConfirmDialog();
		});
	},
	getInputName(path) {
		// This correctly creates the path for field inputs, and supports the
		// inputNamePrefix prop that is required for nested fields to work
		return this.props.inputNamePrefix
			? `${this.props.inputNamePrefix}[${path}]`
			: path;
	},

	showOptions() {
		this.setState({
			show_options: true,
		});
	},


	getRuleOptions() {
		const {rules} = this.props.col.field;
		var _options = [];
		var _button_color = 'default';

		for (var i = 0; i < rules.length; i++) {
			const _rule = rules[i];
			Object.keys(this.props.data.fields).forEach(key => {
				if (typeof this.props.data.fields[_rule.key] !== "undefined" && this.props.data.fields[_rule.key] === _rule.value) {

					if (typeof _rule.options.button !== "undefined") {
						_button_color = _rule.options.button;
					}

					_options = _rule.options.map(function (_item) {
						return {
							value: _item,
							label: _item.toString().split('_').join(' ').toUpperCase(),
						}
					});
				}
			})
		}
		return {options: _options, button: _button_color};
	},
	toggleConfirmDialog() {
		this.setState({
			state_confirm: false,
		});
	},
	renderConfirmDialog() {
		return (
			<ConfirmationDialog
				confirmationLabel="Confirm"
				isOpen={this.state.state_confirm}
				onCancel={this.toggleConfirmDialog}
				onConfirmation={this.valueChanged}
			>
				<p>Are you sure change to <strong>{this.state.state_confirm}</strong>?</p>
			</ConfirmationDialog>
		)
	},
	renderValue() {


		const {numeric, ops, path, required, rules} = this.props.col.field;

		const val = this.props.data.fields.state;

		const clearable = !required;
		const _ruleOptions = this.getRuleOptions();

		const _options = _ruleOptions.options;

		// TODO: This should be natively handled by the Select component

		const options = (numeric)
			? _options.map(function (i) {
				return {label: i.label, value: String(i.value)};
			})
			: _options;

		const value = (typeof val === 'number')
			? String(val)
			: val;


		// console.log(options);

		if (this.state.show_options) {
			return (
				<div
					className='select-menu'>
					<input type="text" style={{position: 'absolute', width: 1, height: 1, zIndex: -1, opacity: 0}}
								 tabIndex="-1"/>
					<Select
						simpleValue
						name={this.getInputName(path)}
						clearable={clearable}
						value={value}
						options={options}
						onChange={this.valueChanged2}
					/>
				</div>
			)
		} else if (options.length === 0) {
			var color = _ruleOptions.button;

			return (
				<Button disabled={true} size="small" type="submit" data-button-type="submit" color={color} block={true}
								style={{textTransform: 'capitalize'}}>
					{value}
				</Button>
			)
		} else {
			return (
				<div style={{position: 'relative'}}>
					<Button size="small" type="submit" data-button-type="submit" color='primary' block={true}
									style={{textTransform: 'capitalize'}} onClick={this.showOptions}>
						{value.toString().split('_').join(' ').toUpperCase()}
					</Button>
				</div>
			)
		}
	},
	render() {
		return (
			<ItemsTableCell>
				{this.renderConfirmDialog()}
				{this.renderValue()}
			</ItemsTableCell>
		);
	},
});

module.exports = SelectColumn;
