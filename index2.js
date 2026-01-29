/*

  index.js - part of grblHAL Web Builder for building binaries

  Part of grblHAL

  Copyright (c) 2022-2026 Terje Io

  grblHAL is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  grblHAL is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with grblHAL. If not, see <http://www.gnu.org/licenses/>.

*/
const drivers_url = './drivers/drivers.json';
const is_dev = typeof getParam('dev') !== 'undefined';
const dropdown_width = 215;
const uri_driver = getParam('driver');
const na = '--- not available ---';
const axisletters = ['A', 'B', 'C', 'U', 'V', 'W'];
const build_options = [
    'pio_board',
    'ldscript',
    'build_dir'
];
const spindle_type = {
    'PWM0': 0,
    'PWM1': 1,
    'VFD': 2,
    'STEPPER': 3,
	'uk': 4
};
var uri_board = getParam('board');
var monitor = {};

var setting_defaults = Array();

let response2 = await fetch(drivers_url + '?t=' + Math.round(new Date().getTime() / 1000));
var data = await response2.json();
const default_caps = data.default_caps;
const main = document.getElementById('main');
const container = document.getElementById('container');

var vendors = addDropdown(main, 'vendors', 'Machine vendor: ');
addDropdownOption(vendors, '--- optional: select vendor ---');
for(const vendor of data.vendors) {
    const el = addDropdownOption(vendors, vendor.name, vendor);
//    if(uri_driver != 'undefined' && driver.folder == uri_driver)
//        vendors.selectedIndex = el.index;
}
var btn = document.createElement('button');
btn.id = 'vendor_url';
btn.disabled = true;
btn.innerText = 'Homepage';
btn.style.marginLeft = '5px';
btn.addEventListener('click', function() {
    window.open(this.URL, '_blank')
})
main.appendChild(btn);

var machines = addDropdown(main, 'machines', 'Machine: ');
addDropdownOption(machines, na);
var btn = document.createElement('button');
btn.id = 'machine_url';
btn.disabled = true;
btn.innerText = 'Homepage';
btn.style.marginLeft = '5px';
btn.addEventListener('click', function() {
    window.open(this.URL, '_blank')
})
main.appendChild(btn);

var variants = addDropdown(main, 'variants', 'Variant: ');
addDropdownOption(variants, na);

main.appendChild(document.createElement('br'));

var drivers = addDropdown(main, 'drivers', 'Driver: ');
addDropdownOption(drivers, '--- select driver ---');
for(const driver of data.drivers) {
    const el = addDropdownOption(drivers, driver.name, driver);
    if(uri_driver != 'undefined' && driver.folder == uri_driver)
        drivers.selectedIndex = el.index;
}
//addDriverInfoButton(main);
var btn = document.createElement('button');
btn.id = 'driver_url';
btn.disabled = true;
btn.innerText = 'Homepage';
btn.style.marginLeft = '5px';
btn.addEventListener('click', function() {
    window.open(this.URL, '_blank')
})
main.appendChild(btn);

var boards = addDropdown(main, 'boards', 'Boards: ');
addDropdownOption(boards, na);
addBoardInfoButton(main);
btn = document.createElement('button');
btn.id = 'board_url';
btn.disabled = true;
btn.innerText = 'Homepage';
btn.style.marginLeft = '5px';
btn.addEventListener('click', function() {
    window.open(this.URL, '_blank')
})
main.appendChild(btn);

btn = document.createElement('button');
btn.id = 'board_map_url';
btn.disabled = true;
btn.innerText = 'Board map';
btn.style.marginLeft = '5px';
btn.addEventListener('click', function() {
    window.open(this.URL, '_blank')
})
main.appendChild(btn);

addTextField(main, 'notes', 'Notes: ', 480, 67);

main.appendChild(document.createElement('br'));
main.appendChild(document.createElement('br'));

btn = document.createElement('button');
btn.id = 'generate';
btn.innerText = 'Generate and download firmware';
btn.disabled = true;
btn.style.width = '220px';
btn.style.height = '30px';
btn.style.marginLeft = '110px';
btn.style.background = 'PowderBlue';
btn.addEventListener('click', generateBinary)
main.appendChild(btn);

btn = document.createElement('button');
btn.id = 'save';
btn.innerText = 'Save board';
btn.disabled = true;
btn.style.height = '30px';
btn.style.marginLeft = '10px';
btn.style.background = 'PowderBlue';
btn.addEventListener('click', saveSelection)
main.appendChild(btn);
btn = document.createElement('button');
btn.id = 'load';
btn.innerText = 'Load board';
btn.style.height = '30px';
btn.style.marginLeft = '10px';
btn.style.background = 'PowderBlue';
btn.addEventListener('click', loadSelection)
main.appendChild(btn);

var div = document.createElement('div');
var progressbar = document.createElement('div');
div.style.marginTop = '6px';
div.style.marginLeft = '100px';
div.style.width = '200px';
div.style.height = '15px';
div.style.background = 'LightGrey';
div.style.display = 'none';
progressbar.style.width = '0%';
progressbar.style.height = '15px';
progressbar.style.background = 'green';
main.appendChild(div).appendChild(progressbar);

div = document.createElement('div');
div.style.marginTop = '6px';
var a = document.createElement('a');
a.href = 'https://github.com/grblHAL/core/wiki/Compiling-GrblHAL';
a.textContent = 'How to flash the firmware';
a.target = '_blank';
a.style.marginTop = '6px';
a.style.marginLeft = '110px';
div.appendChild(a);

a = document.createElement('span');
a.textContent = 'First time user? ';
a.style.marginTop = '6px';
a.style.marginLeft = '20px';
div.appendChild(a);

a = document.createElement('a');
a.href = 'https://github.com/grblHAL/core/wiki/First-Run-Grbl-Settings';
a.textContent = 'Check out this Wiki page!';
a.target = '_blank';
a.style.marginTop = '6px';
a.style.marginLeft = '3px';
main.appendChild(div).appendChild(a);

const tabs = document.getElementById('tabs');
for(const tab of data.tabs) {

    btn = document.createElement('button');
    btn.id = tab.tab_id;
    btn.innerText = tab.name;
    btn.style.marginLeft = '0px';
    btn.disabled = true;

    btn.addEventListener('click', function() {
        if(!data.tabs[this.id].div)
            return;

        for(const tab of data.tabs) {
            tab.div.style.display = tab.tab_id == this.id ? 'block' : 'none';
            if(tab.tab_id == this.id) {
                tab.btn.className += ' active';
                if(!tab.div.privateData)
                    lineUp(tab.div);
            } else
                tab.btn.className = tab.btn.className.replace(' active', '')
        }
    })

    tab.div = null;
    tab.btn = btn;

    tabs.appendChild(btn);
}

document.getElementById('logo').onclick = function() {
    window.open('https://github.com/grblHAL', '_blank');
}

document.getElementsByClassName('close')[0].onclick = function() {
    document.getElementById("myModal").style.display = 'none';
}

document.getElementsByClassName('close')[1].onclick = function() {
    document.getElementById("axisletters").style.display = 'none';
}

window.onclick = function(event) {
    var modal = document.getElementById("myModal");
    if (event.target == modal) {
        modal.style.display = "none";
    }
    modal = document.getElementById("axisletters");
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

function addInfoButton (div, url)
{
    btn = document.createElement('button');
    btn.id = 'info';
    btn.innerText = 'i';
    btn.style.width =
    btn.style.height = '20px';
    btn.style.marginLeft = '5px';
    btn.style.color = 'White';
    btn.style.background = 'RoyalBlue';
    if(url)
        btn.url = url;
    else
        btn.disabled = true;

    btn.addEventListener('click', function() {
        window.open(this.url, '_blank')
    })

    div.appendChild(btn);

    return btn;
}

function axisletters_clear()
{
	var div = document.getElementById('axisletters-content');
	while(div.firstElementChild !== div.lastElementChild)
		div.removeChild(div.lastElementChild);
}

function axisletters_add(remapaxes)
{
	var modal = document.getElementById("axisletters");
	var div = document.getElementById('axisletters-content');

	axisletters_get();

	if(div.firstElementChild === div.lastElementChild) {

		a = document.createElement('span');
		a.innerHTML = '<b>Axis letter mappings:</b>';
		a.style.marginTop = '6px';
		a.style.marginLeft = '10px';
		div.appendChild(a);
		div.appendChild(document.createElement('br'));

		for(var i = 0; i < remapaxes; i++) {
			var symbol = 'AXIS' + (i + 3).toString() + '_LETTER';
			var dd = addDropdown(div, symbol, 'Axis ' + (i + 4).toString() + ': ', 40, 40);
			for(var l = i; l < axisletters.length; l++)
				var el = addDropdownOption(dd, axisletters[l]);
		}
		a = document.createElement('span');
		a.innerHTML = '<br><br><b>NOTE:</b> axis letters will always be assigned in ascending order.';
		a.style.marginTop = '6px';
		a.style.marginLeft = '10px';
		div.appendChild(a);
	}

	return modal;
}

function axisletters_get()
{
	var letters = Array(), symbols = Array();
	const remapaxes = document.getElementById('N_AXIS').selectedIndex;

	if(remapaxes) {

		for(var i = 0; i < remapaxes; i++) {
			var axismap = document.getElementById('AXIS' + (i + 3).toString() + '_LETTER');
			if(axismap) {
				var letter = axismap.options[axismap.selectedIndex].value;
				if(!letters.includes(letter))
					letters.push(letter);
			}
		}

		if(letters.length == remapaxes) {

			letters.sort();

			var is_standard = true;

			for(var i = 0; i < remapaxes; i ++) {
				if(letters[i] != axisletters[i])
					is_standard = false;
			}

			if(!is_standard) for(var i = 0; i < remapaxes; i ++)
				symbols.push('AXIS' + (i + 3).toString() + '_LETTER=\'' + letters[i] + '\'');
		}
	}

	console.log(symbols);
	return symbols;
}

function addMenuButton (div, id)
{
    btn = document.createElement('button');
    btn.id = id;
    btn.innerText = '_';
    btn.style.width =
    btn.style.height = '22px';
    btn.style.marginLeft = '2px';
//    btn.style.color = 'White';
//    btn.style.background = 'RoyalBlue';
    btn.disabled = true;

    btn.addEventListener('click', function() {
		axisletters_add(document.getElementById('N_AXIS').selectedIndex).style.display = 'block';
    })

    div.appendChild(btn);

    return btn;
}

function addBoardInfoButton (div)
{
    btn = document.createElement('button');
    btn.id = 'info';
    btn.innerText = 'i';
    btn.style.width =
    btn.style.height = '20px';
    btn.style.marginLeft = '5px';
    btn.style.color = 'White';
    btn.style.background = 'RoyalBlue';

    btn.addEventListener('click', function() {

        var modal = document.getElementById("myModal");
        var div = document.getElementById('modal-content');
        var boards = document.getElementById('boards');
        var board = boards[boards.selectedIndex].privateData;
        const caps = getBoardCaps(board);
        const dcaps = getDriverProperties().caps;

        while(div.firstElementChild !== div.lastElementChild)
            div.removeChild(div.lastElementChild);

        modal.style.display = 'block';
        a = document.createElement('span');
        a.innerHTML = '<b>' + board.name + '</b> - board capabilities (work in progress: may be incorrect):';
        a.style.marginTop = '6px';
        a.style.marginLeft = '10px';
        div.appendChild(a);
        div.appendChild(document.createElement('br'));
        div.appendChild(document.createElement('br'));

        let tbl = document.createElement('table');
        tbl.style.marginLeft = '20px';
        let thead = document.createElement('thead');
        tbl.appendChild(thead);
        let tbdy = document.createElement('tbody');
        let tr = document.createElement('tr');
        default_caps.filter(caps => caps.label != '').forEach(cap => {
            if(caps.hasOwnProperty(cap.key)) {
                if(caps[cap.key] != 0) {
                    let tr = document.createElement('tr');
                    var td = document.createElement('td');
                    td.appendChild(document.createTextNode(cap.label + ':'));
                    tr.appendChild(td);
                    td = document.createElement('td');
                    td.appendChild(document.createTextNode(cap.type == 'boolean' || (cap.key == 'eeprom' && caps[cap.key] == 1)
                                    ? 'yes'
                                    : caps[cap.key] + (cap.key == 'eeprom' ? ' kbits' : '')));
                    tr.appendChild(td);
                    tbdy.appendChild(tr);
                } else if(dcaps.hasOwnProperty(cap.key) && dcaps[cap.key] > 0) {
                    let tr = document.createElement('tr');
                    var td = document.createElement('td');
                    td.appendChild(document.createTextNode(cap.label + ':'));
                    tr.appendChild(td);
                    td = document.createElement('td');
                    td.appendChild(document.createTextNode(cap.type == 'boolean' || cap.key == 'eeprom' ? 'no' : '0'));
                    tr.appendChild(td);
                    tbdy.appendChild(tr);
                }
            }
        });
        tbl.appendChild(tbdy);
        div.appendChild(tbl);
    })

    div.appendChild(btn);

    return btn;
}

function addDriverInfoButton (div)
{
    btn = document.createElement('button');
    btn.id = 'info';
    btn.innerText = 'i';
    btn.style.width =
    btn.style.height = '20px';
    btn.style.marginLeft = '5px';
    btn.style.color = 'White';
    btn.style.background = 'RoyalBlue';

    btn.addEventListener('click', function() {

        var modal = document.getElementById("myModal");
        var div = document.getElementById('modal-content');
        const caps = getDriverProperties().caps;

        while(div.firstElementChild !== div.lastElementChild)
            div.removeChild(div.lastElementChild);

        modal.style.display = 'block';
        a = document.createElement('span');
        a.innerHTML = '<b>' + getDriverProperties().name + '</b> - driver capabilities (work in progress: may be incorrect):';
        a.style.marginTop = '6px';
        a.style.marginLeft = '10px';
        div.appendChild(a);
        div.appendChild(document.createElement('br'));
        div.appendChild(document.createElement('br'));

        let tbl = document.createElement('table');
        tbl.style.marginLeft = '20px';
        let thead = document.createElement('thead');
        tbl.appendChild(thead);
        let tbdy = document.createElement('tbody');
        let tr = document.createElement('tr');
        default_caps.filter(caps => caps.label != '').forEach(cap => {
            if(caps.hasOwnProperty(cap.key)) {
                if(caps[cap.key] != 0) {
                    let tr = document.createElement('tr');
                    var td = document.createElement('td');
                    td.appendChild(document.createTextNode(cap.label + ':'));
                    tr.appendChild(td);
                    td = document.createElement('td');
                    td.appendChild(document.createTextNode(cap.type == 'boolean' || (cap.key == 'eeprom' && caps[cap.key] == 1)
                                    ? 'yes'
                                    : caps[cap.key] + (cap.key == 'eeprom' ? ' kbits' : '')));
                    tr.appendChild(td);
                    tbdy.appendChild(tr);
                } else {
                    let tr = document.createElement('tr');
                    var td = document.createElement('td');
                    td.appendChild(document.createTextNode(cap.label + ':'));
                    tr.appendChild(td);
                    td = document.createElement('td');
                    td.appendChild(document.createTextNode(cap.type == 'boolean' || cap.key == 'eeprom' ? 'no' : '0'));
                    tr.appendChild(td);
                    tbdy.appendChild(tr);
                }
            }
        });
        tbl.appendChild(tbdy);
        div.appendChild(tbl);

    })

    div.appendChild(btn);

    return btn;
}

function addTextField (container, id, labelr, width = 300, offset = 50)
{
    var dropdown = document.createElement('input');
    dropdown.id = dropdown.name = id;
    dropdown.style.width = width + 'px';
    dropdown.style.marginTop = '4px';
    dropdown.type = 'text';
    dropdown.disabled = dropdown.readonly = true;

    var label = document.createElement('label');
    label.innerHTML = labelr;
    label.htmlFor = id;
    label.style.marginTop = '13px';
    label.style.marginLeft = offset + 'px';

    container.appendChild(document.createElement('br'));
    container.appendChild(label).appendChild(dropdown);

    if(container.parentElement)
        label.style.marginLeft = parseInt(label.style.marginLeft.replace('px', '')) + parseInt(dropdown.style.width.replace('px', '')) + 50 - label.offsetWidth + 'px';

    return dropdown;
}

function makeSymbol (symbol)
{
    // typeof opt.symbol.value !== 'undefined'
    return symbol.value ? symbol.name + '=' + symbol.value : undefined;
}

function monitorChanged (name, new_value, old_value)
{
	switch(name) {

		case 'axes':
			if(new_value == 3 || old_value == 3) {
				dropdownChanged(document.getElementById('SPINDLE0_ENABLE'));
				dropdownChanged(document.getElementById('SPINDLE1_ENABLE'));
				dropdownChanged(document.getElementById('SPINDLE2_ENABLE'));
				dropdownChanged(document.getElementById('SPINDLE3_ENABLE'));
			}
			break;
	}
}

function addDropdown (container, id, labelr, width = 300, offset = 60)
{
    var dropdown = document.createElement('select');
    dropdown.id = dropdown.name = id;
    dropdown.style.width = width + 'px';
    dropdown.style.marginTop = '4px';

    var label = document.createElement('label');
    label.innerHTML = labelr;
    label.htmlFor = id;
    label.style.marginTop = '13px';
    label.style.marginLeft = offset + 'px';

    container.appendChild(document.createElement('br'));
    container.appendChild(label).appendChild(dropdown);

    if(container.parentElement)
        label.style.marginLeft = parseInt(label.style.marginLeft.replace('px', '')) + parseInt(dropdown.style.width.replace('px', '')) + 50 - label.offsetWidth + 'px';

    return dropdown;
}

function addDropdownOption (obj, name, privateData = undefined)
{
    var el = document.createElement('option');
    el.textContent = el.value = name;
    if(typeof privateData != 'undefined')
        el.privateData = privateData;
    obj.appendChild(el);

    return el;
}

function get_idx_bn (dropdown, name)
{
    var i;

    for(i = 0; i < dropdown.options.length; i++) {
        if(dropdown.options[i].value == name)
            return i;
    }

    return -1;
}

function isModbusSpindle (spindle)
{
	return spindle.privateData2.resources.modbus_rtu === 1;
}

function dropdownChanged (dropdown)
{
	if(!dropdown)
		return;

    var boards = document.getElementById('boards');
    var board = boards[boards.selectedIndex].privateData;
    const el = dropdown[dropdown.selectedIndex];
    const resources = (el.privateData2 && el.privateData2.resources !== undefined) ? el.privateData2.resources : dropdown.valuePrevious;

    if(resources !== undefined) {

        const claim = el.privateData2 && el.privateData2.resources !== undefined;

        Object.keys(monitor).forEach(resource => {
            if(resources.hasOwnProperty(resource)) {

				var skip = false;

                if(!dropdown.valuePrevious)
                    dropdown.valuePrevious = {};
                if(!dropdown.valuePrevious.hasOwnProperty(resource))
                    dropdown.valuePrevious[resource] = 0;

				// Handle shared serial port between keypad and MPG
				if(resource == 'serial_ports' && (dropdown.id == 'KEYPAD_ENABLE' || dropdown.id == 'MPG_ENABLE')) {
					const sp = document.getElementById(dropdown.id == 'KEYPAD_ENABLE' ? 'MPG_ENABLE' : 'KEYPAD_ENABLE');
					if(sp.valuePrevious) {
						if(sp.valuePrevious[resource] == 1)
							skip = true;
						else if(dropdown.valuePrevious[resource] == 1 && resources[resource] == 0) {
							dropdown.valuePrevious[resource] = 0;
							if((sp.valuePrevious[resource] = sp[sp.selectedIndex].privateData2.resources[resource]) == 0) {
								monitor[resource].used -= 1;
								if(monitor[resource].used < 0)
									monitor[resource].used = 0;
							}
							skip = true;
						}
					}
				}
				// ---

				if(!skip) {
					if(claim)
						monitor[resource].used += resources[resource] - dropdown.valuePrevious[resource];
					else
						monitor[resource].used -= dropdown.valuePrevious[resource];
					if(monitor[resource].used < 0)
						monitor[resource].used = 0;
					dropdown.valuePrevious[resource] = claim || dropdown.valuePrevious[resource] == 0 ? resources[resource] : 0;
				}
            }
        });

/*
        for(var resource in monitor) {
            if(typeof resources[resource] != 'undefined') {
                if(!dropdown.valuePrevious)
                    dropdown.valuePrevious = {};
                if(typeof dropdown.valuePrevious[resource] == 'undefined')
                    dropdown.valuePrevious[resource] = 0;
                if(el.privateData2 && el.privateData2.resources !== undefined)
                    monitor[resource].used += resources[resource] - dropdown.valuePrevious[resource];
                else
                    monitor[resource].used -= dropdown.valuePrevious[resource];
                if(monitor[resource].used < 0)
                    monitor[resource].used = 0;
                dropdown.valuePrevious[resource] = resources[resource];
            }
        } */
        checkResources();
    }

    if(dropdown) switch(dropdown.id) {

        case 'FANS_ENABLE':
            monitor['digital_out'].used += dropdown.selectedIndex - dropdown.valuePrevious;
            dropdown.valuePrevious = dropdown.selectedIndex;
            checkResources();
            break;

        case 'COMPATIBILITY_LEVEL':
            const estop = document.getElementById('ESTOP_ENABLE');
            if(estop && estop.privateData2.available) {
                estop.disabled = dropdown.selectedIndex > 1;
                estop.checked = !estop.disabled;
            }
            break;

        case 'N_AXIS':
            const axisremap = document.getElementById('AXIS_REMAP_ABC2UVW');
            const axismenu = document.getElementById('N_AXIS_MENU');
            axisremap.disabled = !(dropdown.selectedIndex > 0 && dropdown.selectedIndex < 4);
            axismenu.disabled = !(dropdown.selectedIndex > 0 && dropdown.selectedIndex < 4);
            axisoptEnable('X_AXIS_OPT', board.caps.axes <= dropdown.value);
            axisoptEnable('Y_AXIS_OPT', board.caps.axes <= dropdown.value);
            axisoptEnable('Z_AXIS_OPT', board.caps.axes <= dropdown.value);
			const used = monitor['axes'].used;
			monitor['axes'].used = parseInt(dropdown.value);
			monitorChanged('axes', monitor['axes'].used, used);
			axisletters_clear(); console.log("41");
			break;

		case 'SPINDLE0_ENABLE':
			var all_selected = el.privateData && el.privateData.split('=')[1] == -1;
			var cloned_selected = el.privateData && el.privateData.split('=')[1] == 17
			var spindle = document.getElementById('SPINDLE1_ENABLE');
			if(all_selected)
				spindle.selectedIndex = 0;
			spindle.disabled = all_selected;
			spindle = document.getElementById('SPINDLE2_ENABLE');
			if(all_selected)
				spindle.selectedIndex = 0;
			spindle.disabled = all_selected;
			spindle = document.getElementById('SPINDLE3_ENABLE');
			if(all_selected || cloned_selected)
				spindle.selectedIndex = 0;
			spindle.disabled = all_selected || cloned_selected;
			// no break
		case 'SPINDLE1_ENABLE':
		case 'SPINDLE2_ENABLE':
		case 'SPINDLE3_ENABLE':
            const modbus = document.getElementById('MODBUS_ENABLE');
 			const lastIsStepper = getSpindleType(dropdown.lastElementChild.privateData2.symbol.value) == spindle_type.STEPPER;
			if(monitor['axes'].used > 3) {
				if(!lastIsStepper) {
					var opt = data.spindles[16];
					const ddo = addDropdownOption(dropdown, opt.name, dropdown.id + '=' + opt.symbol.value);
					ddo.privateData2 = opt;
				}
			} else if(lastIsStepper) {
				if(el == dropdown.lastElementChild)
					dropdown.selectedIndex = dropdown.id == 'SPINDLE0_ENABLE' ? 1 : 0;
				dropdown.removeChild(dropdown.lastElementChild);
			}
            if(modbus.selectedIndex == 0 && isModbusSpindle(dropdown[dropdown.selectedIndex])) {
                modbus.selectedIndex = 4;
                dropdownChanged(modbus);
            }
            break;

        case 'MODBUS_ENABLE':
		    const caps = getBoardCaps(board);
            const modbusdir = document.getElementById('MODBUS_DIR_AUX');
			if(dropdown.selectedIndex > 0)
				modbusdir.checked = modbusdir.checked || caps.modbus_rtu_dir;
            else if(modbusdir.checked) {
                modbusdir.checked = false;
                checkboxChanged(modbusdir);
            }
            modbusdir.disabled = dropdown.selectedIndex == 0 || caps.modbus_rtu_dir;
            if(dropdown.selectedIndex == 0) {
				var spindle = document.getElementById('SPINDLE0_ENABLE');
				if(isModbusSpindle(spindle[spindle.selectedIndex]))
					spindle.selectedIndex = 0;
				spindle = document.getElementById('SPINDLE1_ENABLE');
				if(isModbusSpindle(spindle[spindle.selectedIndex]))
					spindle.selectedIndex = 0;
				spindle = document.getElementById('SPINDLE2_ENABLE');
				if(isModbusSpindle(spindle[spindle.selectedIndex]))
					spindle.selectedIndex = 0;
				spindle = document.getElementById('SPINDLE3_ENABLE');
				if(isModbusSpindle(spindle[spindle.selectedIndex]))
					spindle.selectedIndex = 0;
			}
            break;

        case 'KEYPAD_ENABLE':
            const macros = document.getElementById('MACROS_ENABLE');
            if(macros && dropdown.selectedIndex == 0) {
                if(macros.selectedIndex == 2)
                    macros.selectedIndex = 0;
                else if(macros.selectedIndex == 3)
                    macros.selectedIndex = 1;
                dropdownChanged(macros);
            }
            break;

        case 'MACROS_ENABLE':
            const n_macros = document.getElementById('N_MACROS');
            n_macros.disabled = dropdown.selectedIndex == 0;
            if(dropdown.selectedIndex == 0)
                n_macros.selectedIndex = 0;
            dropdownChanged(n_macros);
            dropdownChanged(n_macros); // called twice for updating resource usage
            if(dropdown.selectedIndex > 1) {
                const keypad = document.getElementById('KEYPAD_ENABLE');
                if(keypad.selectedIndex == 0 && !keypad.disabled) {
                    const idx = get_idx_bn(keypad, 'UART');
                    keypad.selectedIndex = idx == -1 ? 1 : idx;
                    dropdownChanged(keypad);
                }
            }
            break;

        case 'N_MACROS':
            const macros2 = document.getElementById('MACROS_ENABLE');
            Array.from(dropdown.children).forEach(child => {
                if(macros2.selectedIndex == 1 || macros2.selectedIndex == 3) {
                    if(!dropdown.disabled && child.privateData2 === undefined)
                        child.privateData2 = { resources: { 'digital_in': Number(child.value) } };
                } else if(child.privateData2)
                    delete(child.privateData2);
            });
            break;

        case 'NETWORKING_ENABLE':
            const plugin = getPlugin('NETWORKING_ENABLE');
            if(plugin.suboptions) {
                for(const opt of plugin.suboptions)
                    document.getElementById(opt.symbol.name).disabled = dropdown.selectedIndex == 0;
            }
            const wifi_mode = document.getElementById('WIFI_MODE');
            if(wifi_mode)
                wifi_mode.disabled = (el.privateData !== 'WIFI_ENABLE=1');
            if(dropdown.selectedIndex == 0)
               webuiDisable();
            break;

        case 'WEBUI_ENABLE':
            const webuiauth = document.getElementById('WEBUI_AUTH_ENABLE');
            webuiauth.disabled = dropdown.selectedIndex == 0;
            if(dropdown.selectedIndex > 0) {
                const networking = getNetworking();
                if(networking) {
                    networking.selectedIndex = 1;

                    const sdcard = document.getElementById('SDCARD_ENABLE');
                    if(sdcard && !sdcard.disabled && sdcard.selectedIndex == 0)
                        sdcard.selectedIndex = 1;

                    document.getElementById('HTTP_ENABLE').checked = true;
                    document.getElementById('WEBSOCKET_ENABLE').checked = true;

                    dropdownChanged(networking);
                }
            }
            break;

        case 'SDCARD_ENABLE':
            if(dropdown.selectedIndex == 0) {
                if(getNetworking()) {
                    document.getElementById('FTP_ENABLE').checked = false;
                    document.getElementById('WEBDAV_ENABLE').checked = false;
                    document.getElementById('HTTP_ENABLE').checked = false;
                }
                if(document.getElementById('EMBROIDERY_ENABLE'))
                    document.getElementById('EMBROIDERY_ENABLE').checked = false;
                webuiDisable();
            }
            break;

        case 'EEPROM_ENABLE':
            const fram = document.getElementById('EEPROM_IS_FRAM');
            fram.disabled = dropdown.selectedIndex == 0;
            break;

        case 'TRINAMIC_ENABLE':
            const tmc_mode = document.getElementById('TRINAMIC_MODE');
            const tmc_extended = document.getElementById('TRINAMIC_EXTENDED_SETTINGS');
             while(tmc_mode.firstElementChild)
                tmc_mode.removeChild(tmc_mode.lastElementChild);
            if(dropdown.selectedIndex == 0 && typeof dropdown.privateData2.tmc_options[dropdown.selectedIndex] == 'undefined') {
                var ddo = addDropdownOption(tmc_mode, 'N/A', tmc_mode.privateData[0].symbol.name);
                ddo.privateData2 = dropdown.privateData[0];
            } else {
                const caps = getBoardCaps(board);
                const tmc_com = dropdown.privateData2.tmc_options[dropdown.selectedIndex].tmc_com;
                for(var i = 1; i < tmc_mode.privateData.length; i++) {
                    const mode = tmc_mode.privateData[i];
                    if((tmc_com == 'spi' && mode.tmc_mode == 'spi_cs' && caps.trinamic_spi_cs) ||
                        (tmc_com == 'spi' && mode.tmc_mode == 'spi_chained' && caps.trinamic_spi_chain) ||
                         (tmc_com == 'uart' && mode.tmc_mode == 'uart_n' && caps.trinamic_uart_n) ||
                          (tmc_com == 'uart' && mode.tmc_mode == 'uart_addr' && caps.trinamic_uart_addr)) {
                        var ddo = addDropdownOption(tmc_mode, mode.name, makeSymbol(mode.symbol));
                        ddo.privateData2 = mode;
                    }
                }
            }
            tmc_mode.disabled = tmc_mode.childElementCount < 2;
            if((tmc_extended.disabled = dropdown.selectedIndex == 0))
                tmc_extended.checked = false;
            dropdownChanged(tmc_mode);
            break;

        case 'DISPLAY_ENABLE':
        case 'TEMPLATE_ENABLE':
        case 'STATUS_LIGHT_ENABLE':
            if(dropdown.privateData.btn) {
                dropdown.privateData.btn.url = dropdown.privateData.options[dropdown.selectedIndex].URL
                                                ? dropdown.privateData.options[dropdown.selectedIndex].URL
                                                : dropdown.privateData.URL;
                dropdown.privateData.btn.disabled = dropdown.privateData.btn.url === undefined || dropdown.privateData.btn.url == '';
            }
            break;
    }
}

function addCheckbox (container, id, labelr, checked, offset=0)
{
    var checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = checkbox.name = id;
    checkbox.value = 'value';
    checkbox.style.marginLeft = (142 + offset) + 'px';

    var label = document.createElement('label');
    label.htmlFor = id;
    label.appendChild(document.createTextNode(labelr));

    checkbox.checked = checked;
    checkbox.onclick = function() {
        checkboxChanged(this);
    }

    container.appendChild(document.createElement('br'));
    container.appendChild(checkbox);
    container.appendChild(label);

    return checkbox;
}

function checkboxChanged (btn)
{
    if(btn.privateData2 && btn.privateData2.resources) {
        for(var resource in monitor) {
            if(btn.privateData2.resources[resource]) {
				if(!(resource == "control_inputs" && typeof(btn.privateData) == 'undefined' && !btn.checked))
					monitor[resource].used += btn.checked ? btn.privateData2.resources[resource] : - btn.privateData2.resources[resource];
			}
			if(monitor[resource].used < 0)
				monitor[resource].used = 0;
        }
        checkResources();

		if(btn.id.startsWith('CONTROL_ENABLE_'))
			btn.privateData = 1;
    }

    switch(btn.id) {

        case 'HTTP_ENABLE':
            if(!btn.checked) {
                document.getElementById('WEBDAV_ENABLE').checked = false;
                webuiDisable();
            } else {
                const sdcard = document.getElementById('SDCARD_ENABLE');
                if(sdcard && !sdcard.disabled && sdcard.selectedIndex == 0)
                    sdcard.selectedIndex = 1;
            }
            break;

        case 'SPINDLE_SYNC_ENABLE':
            const pid_log = document.getElementById('PID_LOG');
            pid_log.disabled = !btn.checked;
            if(!btn.checked)
                pid_log.checked = false;
            break;

        case 'WEBSOCKET_ENABLE':
            if(!btn.checked)
                webuiDisable();
            break;

		case 'PROBE_ENABLE':
			const relays = document.getElementById('PROBE_RELAYS');
			if(relays) {
				if((relays.disabled = !btn.checked || (monitor['digital_out'].board - monitor['digital_out'].used == 0)))
					relays.checked = false;
			}
			checkResources();
			break;

        case 'WEBDAV_ENABLE':
            if(btn.checked) {
                const http = document.getElementById('HTTP_ENABLE');
                http.checked = true;
                checkboxChanged(http);
                const sdcard = document.getElementById('SDCARD_ENABLE');
                if(sdcard && !sdcard.disabled && sdcard.selectedIndex == 0)
                    sdcard.selectedIndex = 1;
            }
            break;

        case 'FTP_ENABLE':
        case 'EMBROIDERY_ENABLE':
            if(btn.checked) {
                const sdcard = document.getElementById('SDCARD_ENABLE');
                if(sdcard && !sdcard.disabled && sdcard.selectedIndex == 0)
                    sdcard.selectedIndex = 1;
            }
            break;

        case 'ENABLE_JERK_ACCELERATION':
            const atps = document.getElementById('ACCELERATION_TICKS_PER_SECOND');
            if(atps) {
                atps.disabled = !btn.checked;
                atps.selectedIndex = 0;
            }
            break;

        default:
            if(btn.checked && btn.privateData2 && btn.privateData2.resources) {
                if(btn.privateData2.resources['modbus_rtu'] == 1) {
                    const modbus = document.getElementById('MODBUS_ENABLE');
                    if(modbus.selectedIndex == 0) {
                        modbus.selectedIndex = 4;
                        dropdownChanged(modbus);
                    }
                }
            }
            break;
    }
}

function driverSelected (driver, result, board_idx = 0)
{
    var feature = '', modbus = false;
    driver.caps = result.caps;
    driver.symbols = result.symbols;
    driver.symbols_networking = result.symbols_networking;
    driver.docker_instance = result.docker_instance;

    generateEnable(true);

    monitor = {};
    data.resource_monitor.forEach(function(resource) {
        monitor[resource] = { 'driver': driver.caps[resource] ? driver.caps[resource] : 0, 'board': 0, 'used': 0 };
    });

    while (boards.hasChildNodes())
        boards.removeChild(boards.lastChild);

    for(let board of result.boards) {
        var optn = board.name;
        var el = document.createElement('option');
        el.textContent = optn;
        el.value = optn;
        el.privateData = board;
        boards.appendChild(el);
    }

    if(board_idx == 0 && drivers.selectedIndex > 0 && uri_board !== undefined) {
        for(var board of document.getElementById('boards')) {
            if(board.value == uri_board || board.privateData.symbol == uri_board)
                board_idx = board.index;
        }
        uri_board = undefined;
    }

    boards.selectedIndex = board_idx;

    for(const tab of data.tabs) {
        if(tab.div)
            container.removeChild(tab.div);
        tab.div = document.createElement('div');
        tab.div.id = tab.tab_id.toString();
        tab.div.style.display = tab.tab_id == 0 ? 'block' : 'none';
        tab.div.className += ' tabcontent';
    }

    for(let coreopt of data.core) {

        const div = data.tabs[coreopt.tab_id ? coreopt.tab_id : 0].div;

        switch(coreopt.symbol.name) {

            case 'USB_SERIAL_CDC':
                // hasResources(driver.caps, coreopt.resources);
                const com = addDropdown(div, coreopt.symbol.name, coreopt.name + ': ', dropdown_width, 62);
                com.privateData = coreopt.options;
                com.onchange = function() { dropdownChanged(this); }
                // options added by board handler
                break;

            default:

                if(coreopt.options) {
                    if(coreopt.symbol.type == 'dropdown') {
                        var dd = addDropdown(div, coreopt.symbol.name, coreopt.name + ': ', dropdown_width, 62);
                        if(coreopt.URL)
                            addInfoButton(div, coreopt.URL);
						if(coreopt.symbol.name == 'N_AXIS')
                            addMenuButton(div, coreopt.symbol.name + '_MENU');
                        dd.onchange = function() { dropdownChanged(this); }
                        for(let opt of coreopt.options) {
                            var el = addDropdownOption(dd, opt.name, typeof opt.symbol.value !== 'undefined' ? makeSymbol(opt.symbol) : undefined);
                            if(opt.resources)
                                el.privateData2 = opt;
                        }
                    } else {
                        var cb = addCheckbox(div, coreopt.symbol.name, coreopt.name, false);
                        if(coreopt.URL)
                            addInfoButton(div, coreopt.URL);
                        if(coreopt.symbol.value)
                            cb.privateData = coreopt.symbol.name + '=' + coreopt.symbol.value;
                        for(let opt of coreopt.options) {
                            if(opt.symbol.type == 'bool') {
                                var cb = addCheckbox(div, opt.symbol.name, opt.name, false, 10);
                                cb.disabled = true;
                                if(opt.symbol.value)
                                    cb.privateData = opt.symbol.name + '=' + opt.symbol.value;
                            } else if(opt.symbol.type == 'dropdown') {
                                var dd = addDropdown(div, opt.symbol.name, opt.name + ': ', 120, 82);
                                dd.disabled = true;
                                for(let optd of opt.options) {
                                    var el = addDropdownOption(dd, optd.name, typeof optd.symbol.value !== 'undefined' ? makeSymbol(optd.symbol) : undefined);
                                    if(optd.resources || optd.symbols)
                                        el.privateData2 = optd;
                                }
                            }
                        }
                    }
                } else switch(coreopt.symbol.name) {

                    case 'PROBE_ENABLE':
                        if(typeof driver.caps.probe != 'undefined')
                            addCheckbox(div, coreopt.symbol.name, coreopt.name, false);
                        break;

                    default:
                        var cb = addCheckbox(div, coreopt.symbol.name, coreopt.name, false, feature == coreopt.id ? 10 : 0);
                        if(coreopt.symbol.name == 'ENABLE_RESTORE_NVS_WIPE_ALL' || coreopt.symbol.name == 'ENABLE_RESTORE_NVS_DEFAULT_SETTINGS')
                            cb.privateData = coreopt.symbol.name + '=0';
                        if(coreopt.resources)
                            cb.privateData2 = coreopt;
                        if(coreopt.URL)
                            addInfoButton(div, coreopt.URL);
                        break;
                }
                break;
        }
        feature = coreopt.id;
    }

	driver.caps.plugins.push({ 'id': 'file_tooltable'});
	driver.caps.plugins.push({ 'id': 'probe_relays'});

    if(driver.caps.plugins)
      for(let plugin of data.plugins) {
        for(let pi of driver.caps.plugins)
          if(plugin.id == pi.id) {

            if(plugin.id == 'modbus')
                modbus = true;

            const div = data.tabs[plugin.tab_id ? plugin.tab_id : 0].div;

            switch(plugin.symbol.name) {

                case 'TRINAMIC_MODE':
                case 'TRINAMIC_ENABLE':
                    var tmc = addDropdown(div, plugin.symbol.name, plugin.name + ': ', dropdown_width, 62);
                    tmc.privateData = plugin.options;
                    tmc.privateData2 = plugin;
                    tmc.onchange = function() { dropdownChanged(this); }
                    // options added dynamically by board handler
                    break;

                case 'FANS_ENABLE':
                    var fans = addDropdown(div, plugin.symbol.name, 'Fans: ', 70, 62);
                    fans.privateData = plugin;
                    fans.valuePrevious = 0;
                    addDropdownOption(fans, 'None');
                    fans.onchange = function() { dropdownChanged(this); }
                    break;

                default:

                    if(plugin.options) {
                        if(plugin.symbol.type == 'dropdown') {
                            var dd = addDropdown(div, plugin.symbol.name, plugin.name + ': ', dropdown_width, 62);
                            dd.privateData = plugin;
                            if(plugin.URL)
                                addInfoButton(div, plugin.URL);
                            dd.onchange = function() { dropdownChanged(this); }
                            for(let opt of plugin.options) {
                                var ddo = addDropdownOption(dd, opt.name, typeof opt.symbol.value !== 'undefined' ? makeSymbol(opt.symbol) : undefined);
                                if(opt.resources)
                                    ddo.privateData2 = opt;
                            }
                            if(plugin.symbol.name == 'N_MACROS') {
                                dd.disabled = true;
                                dd.valuePrevious = {};
                                dd.valuePrevious['digital_in'] = 0;
                            }
                        } else {
                            var cb = addCheckbox(div, plugin.symbol.name, plugin.name, false);
                            if(plugin.symbol.value)
                                cb.privateData = plugin.symbol.name + '=' + plugin.symbol.value;
                            if(plugin.pio_env)
                                cb.privateData2 = plugin;
                            if(plugin.URL)
                                addInfoButton(div, plugin.URL);
                            for(let opt of plugin.options)
                                addCheckbox(div, opt.symbol.name, opt.name, false, 10).disabled = true;
                        }
                    } else {
                        var cb = addCheckbox(div, plugin.symbol.name, plugin.name, false, feature == plugin.id ? 10 : 0);
                        if(plugin.symbol.value)
                            cb.privateData = plugin.symbol.name + '=' + plugin.symbol.value;
                        if(plugin.pio_env || plugin.resources)
                            cb.privateData2 = plugin;
                        if(plugin.symbol.name == 'PWM_ADD')
                            cb.disabled = true;
                        if(plugin.URL)
                            addInfoButton(div, plugin.URL);
                    }

                    if(plugin.suboptions) {
                        for(let opt of plugin.suboptions)
                            addCheckbox(div, opt.symbol.name, opt.name, false, 10).disabled = true;
                    }
                    break;
            }
            feature = plugin.id;
        }
    }

    for(let signal of data.signals) {
        if(signal.symbol.type == 'bool') {
            const div = data.tabs[signal.tab_id ? signal.tab_id : 5].div;
            var cb = addCheckbox(div, signal.symbol.name, signal.name, false);
            cb.privateData2 = signal;
            if(signal.URL)
                addInfoButton(div, plugin.URL)
        }
    }

    for(let plugin of data.thirdparty) {

        if((plugin.resources && plugin.resources['modbus_rtu']) === 1 ? !modbus : false)
            continue;

    //    if(plugin.tab_id == 4 && driver.name == 'ESP32' && !plugin.idf)
    //        continue;

        const div = data.tabs[plugin.tab_id ? plugin.tab_id : 0].div;

        switch(plugin.symbol.name) {

            case 'TRINAMIC_MODE':
                break;

            default:

                if(plugin.options) {
                    if(plugin.symbol.type == 'dropdown') {
                        var dd = addDropdown(div, plugin.symbol.name, plugin.name + ': ', dropdown_width, 62), opt_urls = false;
                        dd.privateData = plugin;
                        dd.onchange = function() { dropdownChanged(this); }
                        for(let opt of plugin.options) {
                            var ddo = addDropdownOption(dd, opt.name, typeof opt.symbol.value !== 'undefined' ? makeSymbol(opt.symbol) : undefined);
                            if(opt.resources || opt.symbols)
                                ddo.privateData2 = opt;
                            else {
                                ddo.privateData2 = {};
                                ddo.privateData2.resources = {};
                            }
                            if(opt.URL)
                                opt_urls = true;
                        }
                        if(plugin.URL || opt_urls)
                            dd.privateData.btn = addInfoButton(div, plugin.URL);
                    } else {
                        var cb = addCheckbox(div, plugin.symbol.name, plugin.name, false);
                        if(plugin.pio_env)
                            cb.privateData2 = plugin;
                        if(plugin.URL)
                            addInfoButton(div, plugin.URL);
                        for(let opt of plugin.options)
                            addCheckbox(div, opt.symbol.name, opt.name, false, 10).disabled = true;
                    }
                } else {
                    var cb = addCheckbox(div, plugin.symbol.name, plugin.name, false, feature == plugin.id ? 10 : 0);
                    if(plugin.symbol.value)
                        cb.privateData = plugin.symbol.name + '=' + plugin.symbol.value;
                    if(plugin.pio_env || plugin.resources || plugin.thirdparty)
                        cb.privateData2 = plugin;
                    if(plugin.URL)
                        addInfoButton(div, plugin.URL);
                }
                if(plugin.suboptions) {
                    for(let opt of plugin.suboptions)
                        addCheckbox(div, opt.symbol.name, opt.name, false, 10).disabled = true;
                }
                break;
        }
        feature = plugin.id;
    }

    urlbtnSet('driver_url', driver.driverURL + '#readme');

    for(const tab of data.tabs) {
        container.appendChild(tab.div);
        if(tab.id != 0)
            tab.div.display = 'none';
        tab.btn.disabled = !tab.div.firstElementChild ;
    }

    data.tabs[0].btn.click();
		axisletters_clear(); console.log("12");

    boardSelected(result.boards[board_idx]);
}

function vendorSelected (vendor, result)
{
	while(machines.hasChildNodes())
        machines.removeChild(machines.lastChild);

    for(let machine of result.machines) {
	    var optn = machine.name;
        var el = document.createElement('option');
        el.textContent = optn;
        el.value = optn;
        el.privateData = machine;
        machines.appendChild(el);
    }

	machineSelected(machines[0].privateData);
}

function machineLoaded (machine, result)
{
	while (variants.hasChildNodes())
        variants.removeChild(variants.lastChild);

    for(let variant of result.variants) {
	    var optn = variant.name;

		if(result.machine.default_symbols) {

			if(variant.default_symbols === undefined)
				variant.default_symbols = {};

			for (const [symbol, value] of Object.entries(result.machine.default_symbols)) {
				if(!variant.default_symbols.hasOwnProperty(symbol))
					variant.default_symbols[`${symbol}`] = value;
			}
		}

		if(result.machine.setting_defaults) {

			if(variant.setting_defaults === undefined)
				variant.setting_defaults = {};

			for (const [symbol, value] of Object.entries(result.machine.setting_defaults)) {
				if(!variant.setting_defaults.hasOwnProperty(symbol))
					variant.setting_defaults[`${symbol}`] = value;
			}
		}

		if(result.machine.setting_defaults_trinamic) {

			if(variant.setting_defaults_trinamic === undefined)
				variant.setting_defaults_trinamic = {};

			for (const [symbol, value] of Object.entries(result.machine.setting_defaults_trinamic)) {
				if(!variant.setting_defaults_trinamic.hasOwnProperty(symbol))
					variant.setting_defaults_trinamic[`${symbol}`] = value;
			}
		}

		if(variant.default_symbols.hasOwnProperty('EVENTOUT_ENABLE') && !variant.default_symbols.hasOwnProperty('N_EVENTS'))
			variant.default_symbols['N_EVENTS'] = 4;

		if(variant.default_symbols.hasOwnProperty('MACROS_ENABLE') && !variant.default_symbols.hasOwnProperty('N_MACROS'))
			variant.default_symbols['N_MACROS'] = variant.default_symbols['MACROS_ENABLE'] == 2 ? 4 : 2;

        var el = document.createElement('option');
        el.textContent = optn;
        el.value = optn;
        el.privateData = variant;
        variants.appendChild(el);
    }

	if(result.machine.default_driver !== undefined && result.machine.default_board !== undefined) {

		var idx = 0;
		const drivers = document.getElementById('drivers');

		for(var driver of drivers) {
			if(driver.privateData && driver.privateData.name == result.machine.default_driver) {
				uri_board = result.machine.default_board;
				drivers.selectedIndex = idx;
				drivers.onchange();
			}
			idx++;
        }
	}
}

function machineSelected (machine)
{
    if(machine == undefined) {

        while (machine.hasChildNodes())
            machines.removeChild(machines.lastChild);
        while (variants.hasChildNodes())
            variants.removeChild(variants.lastChild);

        addDropdownOption(machines, na);
        addDropdownOption(variants, '--- select variant ---');

        urlbtnSet('vendor_url', '');
        urlbtnSet('machine_url', '');

	} else {

        urlbtnSet('machine_url', machine.URL);

        var url;

		if(machine.profileURL.match('github.com')) {
			url = machine.profileURL.match('github.com') ? machine.profileURL.replace('github.com', 'raw.githubusercontent.com') : machine.profileURL;
			url = url.replace('/blob/main', '');
			url = url.replace('/profiles', '/refs/heads/main/profiles')
		} else
			url = machine.profileURL;

        fetch(url + '?t=' + Math.round(new Date().getTime() / 1000))
        .then(successResponse => {
                return successResponse.status == 200 ? successResponse.json() : null;
            },
            failResponse => {
                return null;
            }
        )
        .then(result => machineLoaded(machine, result));
    }
}

function eeprom_size2index (size)
{
    size = Math.abs(size);

    if(size > 3)
        size = size == 16 ? 1 : (size == 32 ? 2 : (size == 64 ? 3 : (size == 128 ? 4 : 5)));

    return size;
}

function boardSelected (board)
{
    const caps = getBoardCaps(board);
    const driver = getDriverProperties();
	const variant = getVariant();

    setting_defaults = Array();

    document.getElementById('notes').value = (board.notes !== undefined ? board.notes : '');

    urlbtnSet('board_url', board.URL);
    urlbtnSet('board_map_url', board.MAP === undefined ? '' : driver.driverURL + '/blob/master/' + board.MAP);

    for(var resource in monitor) {
        if(default_caps.find(obj => obj.key === resource && obj.derived))
            monitor[resource].board = caps[resource];
        else
            monitor[resource].board = typeof board.caps[resource] == 'number' ? board.caps[resource] : monitor[resource].driver;

		if(resource == 'control_inputs')
			monitor[resource].used = 0;
    }

    for(const tab of data.tabs) {

        if(tab.tab_id == 4)
            tab.btn.disabled = (/*driver.name == 'ESP32' ||*/ driver.name == 'Simulator');

        const elems = tab.div.getElementsByTagName('*');

        for(var feature of elems) {

            if(feature.id) switch(feature.id) {

				case 'CONTROL_ENABLE_RST':
				case 'CONTROL_ENABLE_FH':
				case 'CONTROL_ENABLE_CS':
					feature.checked = false;
					if(!(feature.disabled = monitor['control_inputs'].board == 0 || (monitor['control_inputs'].board == 1 && feature.id != 'CONTROL_ENABLE_RST'))) {
						feature.privateData = undefined;
						if(!(feature.id == 'CONTROL_ENABLE_RST' && monitor['control_inputs'].board == 2))
							feature.checked = monitor['control_inputs'].used < monitor['control_inputs'].board;
						checkboxChanged(feature);
					}
					break;

                case 'EEPROM_ENABLE':
                    feature.disabled = !hasResources(caps, feature.privateData.resources) || caps.eeprom <= 0;
                    feature.selectedIndex = Math.abs(caps.eeprom) > 3 ? getOptionsIndex(feature.privateData.options, Math.abs(caps.eeprom)) : 0;
                    dropdownChanged(feature);
                    break;

                case 'EEPROM_IS_FRAM':
                    if((feature.disabled = document.getElementById('EEPROM_ENABLE').disabled))
                        feature.checked = caps.eeprom_is_fram || (caps.eeprom < 0 && caps.fram);
                    break

                case 'ESTOP_ENABLE':
                    if(!(feature.checked = hasResources(caps, feature.privateData2.resources)))
                        feature.disabled = true;
                    feature.privateData2.available = !feature.disabled;
                    break;

                case 'BLUETOOTH_ENABLE':
                    feature.selectedIndex = 0;
                    while(feature.firstElementChild !== feature.lastElementChild)
                        feature.removeChild(feature.lastElementChild);
                    if(caps.bluetooth || caps.hc05)
                      for(const opt of feature.privateData.options) {
                        if(opt.id != 'bluetooth_off' && hasResources(caps, opt.resources)) {
                            const ddo = addDropdownOption(feature, opt.name, makeSymbol(opt.symbol));
                            ddo.privateData2 = opt;
                        }
                    }
                    feature.disabled = feature.length <= 1;
                    dropdownChanged(feature);
                    break;

                case 'COOLANT_ENABLE':
                    if((feature.disabled = !hasResources(caps, feature.privateData2.resources)))
                        feature.checked = false;
                    checkboxChanged(feature);
                    break;

                case 'FANS_ENABLE':
                    feature.disabled = !hasResources(caps, feature.privateData.resources);
                    while(feature.firstElementChild !== feature.lastElementChild)
                        feature.removeChild(feature.lastElementChild);
                    for(var i = 1; i < 5; i++) {
                        if(i <= board.caps.digital_out)
                            addDropdownOption(feature, i + (i == 1 ? ' fan' : ' fans'), feature.id + '=' + i);
                    }
                    break;

                case 'MODBUS_ENABLE':
                    if((feature.disabled = monitor.serial_ports.board - monitor.serial_ports.used <= 0))
                        feature.selectedIndex = 0;
                    dropdownChanged(feature);
                    break;

                case 'N_AXIS':
                    while(feature.firstElementChild !== feature.lastElementChild)
                        feature.removeChild(feature.lastElementChild);

                    for(var i = 4; i <= board.caps.axes; i++) {
                        const ddo = addDropdownOption(feature, i.toString(), feature.id + '=' + i);
                        ddo.privateData2 = { resources: { 'motors': i } };
                    }

                    feature.disabled = board.caps.axes <= 3;
                    dropdownChanged(feature);
                    break;

                case 'SPINDLE0_ENABLE':
				case 'SPINDLE1_ENABLE':
				case 'SPINDLE2_ENABLE':
				case 'SPINDLE3_ENABLE':
                    feature.selectedIndex = 0;
                    while(feature.firstElementChild !== feature.lastElementChild)
                        feature.removeChild(feature.lastElementChild);
					const hasModbusPort = monitor.serial_ports.board - monitor.serial_ports.used > 0;
                    for(const opt of data.spindles) {
                        if(opt.symbol.value == '13' || opt.symbol.value == '14') {
                            if(feature.id == 'SPINDLE0_ENABLE' || caps.spindle_pwm < 2 || (opt.symbol.value == '13' && caps.spindle_dir < 2))
                                continue;
                        } else if(opt.symbol.value == '15' || opt.symbol.value == '16') {
                            if(feature.id == 'SPINDLE0_ENABLE' || caps.spindle_pwm !== 3 || (opt.symbol.value == '15' && caps.spindle_dir !== 3))
                                continue;
                        } else if(opt.symbol.value == '19') {
                      //      if(feature.id == 'SPINDLE0_ENABLE' || caps.spindle_pwm !== 3 || (opt.symbol.value == '15' && caps.spindle_dir !== 3))
                                continue;
                        } else {
                            if(feature.id != 'SPINDLE0_ENABLE' && (opt.is_driver_spindle === 1 || opt.symbol.value == '-1'))
                                continue;
                            if(opt.resources.spindle_dir === 1 && !(caps.spindle_dir !== 0 || caps.pwm_spindle_aux === 3))
                                continue;
                        }
						if(hasModbusPort || opt.resources.modbus_rtu === 0) {
                            const ddo = addDropdownOption(feature, opt.name, feature.id + '=' + opt.symbol.value);
                            ddo.privateData2 = opt;
						}
                    }
                    if(feature.id == 'SPINDLE0_ENABLE' && feature.length > 1)
                        feature.selectedIndex = 1; // feature.removeChild(feature.firstElementChild);
                    feature.disabled = feature.length <= 1;
                    dropdownChanged(feature);
                    break;

                case 'NETWORKING_ENABLE':
                    feature.selectedIndex = 0;
                    while(feature.firstElementChild !== feature.lastElementChild)
                        feature.removeChild(feature.lastElementChild);

                    for(const opt of feature.privateData.options) {
                        if(opt.id != 'networking_off' && hasResources(caps, opt.resources)) {
                            if(opt.resources["wiznet"] && caps.wiznet != 1 && !opt.id.includes(caps.wiznet.toString()))
                                continue;
                            const ddo = addDropdownOption(feature, opt.name, makeSymbol(opt.symbol));
                            ddo.privateData2 = opt;
                        }
                    }
                    feature.disabled = feature.length <= 1;
                    dropdownChanged(feature);
                    break;

                case 'PROBE_ENABLE':
                    feature.disabled = !caps.probe;
                    feature.checked = caps.probe;
                    break;

				case 'PROBE_RELAYS':
                    feature.disabled = !caps.probe || caps['digital_out'] == 0;
					break;

                case 'SAFETY_DOOR_ENABLE':
                    if((feature.disabled = !caps.safety_door))
                        feature.checked = false;
                    break;

                case 'MOTOR_WARNING_ENABLE':
                    if((feature.disabled = !caps.motor_warning))
                        feature.checked = false;
                    break;

                case 'MOTOR_FAULT_ENABLE':
                    if((feature.disabled = !caps.motor_fault))
                        feature.checked = false;
                    break;

                case 'EVENTOUT_ENABLE':
                        if((feature.disabled = !hasResources(caps, feature.privateData.resources)))
                            feature.selectedIndex = 0;
                        else {
                            while(feature.firstElementChild !== feature.lastElementChild)
                                feature.removeChild(feature.lastElementChild);
                            for(var i = 1; i < Math.min(caps.digital_out, feature.privateData.options.length); i++)
                                addDropdownOption(feature, feature.privateData.options[i].name, makeSymbol(feature.privateData.options[i].symbol));
                        }
                    break;


                case 'RGB_LED_ENABLE':
                    if((feature.disabled = !hasResources(caps, feature.privateData.resources)))
                        feature.selectedIndex = 0;
                    break;

                case 'BLOCK_DELETE_ENABLE':
                case 'BLTOUCH_ENABLE':
                case 'LIMITS_OVERRIDE_ENABLE':
                case 'MCP3221_ENABLE':
                case 'PROBE_DISCONNECT_ENABLE':
                case 'PWM_SERVO_ENABLE':
                case 'SINGLE_BLOCK_ENABLE':
                case 'STOP_DISABLE_ENABLE':
                    if((feature.disabled = !hasResources(caps, feature.privateData2.resources)))
                        feature.checked = false;
                    break;

                case 'SDCARD_ENABLE':
                    feature.disabled = caps.sdcard !== 1;
                    webuiDisable(feature.disabled);
                    dropdownChanged(feature);
                    break;

                case 'SPINDLE_SYNC_ENABLE':
                    feature.disabled = !caps.spindle_sync;
                    checkboxChanged(feature);
                    break;

                case 'TRINAMIC_ENABLE':
                    const tmc_driver = typeof caps.trinamic != 'undefined';
                    const r_sense_cap = typeof caps.trinamic_r_sense != 'undefined';
                    var tmc_count = 0;

                    while(feature.firstElementChild)
                        feature.removeChild(feature.lastElementChild);

                    if(!tmc_driver && feature.childElementCount == 0)
                        addDropdownOption(feature, feature.privateData[0].name);

                    feature.disabled = false;
                    feature.privateData2.tmc_options = Array();

                    for(var i = 1; i < feature.privateData.length; i++) {
                        const tmc = feature.privateData[i];
                        if(tmc_driver) {
                            if(tmc.symbol.value == caps.trinamic) {
                                tmc_count++;
                                addDropdownOption(feature, tmc.name, makeSymbol(tmc.symbol));
                                feature.privateData2.tmc_options[feature.childElementCount - 1] = tmc;
                                if(r_sense_cap && typeof tmc.trinamic_r_sense != 'undefined' && caps.trinamic_r_sense == tmc.trinamic_r_sense) {
                                    tmc_count = 1;
                                    feature.selectedIndex = feature.childElementCount - 1;
                                    break;
                                }
                            }
                        } else if((tmc.tmc_com == 'spi' && (caps.trinamic_spi_cs || caps.trinamic_spi_chain)) ||
                                   (tmc.tmc_com == 'uart' && (caps.trinamic_uart_n || caps.trinamic_uart_addr))) {
                            addDropdownOption(feature, tmc.name, makeSymbol(tmc.symbol));
                            feature.privateData2.tmc_options[feature.childElementCount - 1] = tmc;
                        }
                    }

                    if(feature.childElementCount == 1 || (tmc_driver && tmc_count == 1))
                        feature.disabled = true;

                    dropdownChanged(feature);
                    break;

                case 'USB_SERIAL_CDC':
                    while(feature.firstElementChild)
                        feature.removeChild(feature.lastElementChild);

                    for(const opt of feature.privateData) {
                        if(hasResources(caps, opt.resources)) {
                            const ddo = addDropdownOption(feature, opt.name, makeSymbol(opt.symbol));
                            ddo.privateData2 = opt;
                        }
                    }

                    dropdownChanged(feature);
                    feature.disabled = feature.options.length < 2;
                    break;

                case 'KEYPAD_ENABLE':
                    while(feature.firstElementChild !== feature.lastElementChild)
                        feature.removeChild(feature.lastElementChild);

                    for(const opt of feature.privateData.options) {
                        if(opt.name != 'Disabled' && hasResources(caps, opt.resources) && (opt.resources.serial_ports == 0 || (monitor.serial_ports.board - monitor.serial_ports.used))) {
                            const ddo = addDropdownOption(feature, opt.name, makeSymbol(opt.symbol));
                            ddo.privateData2 = opt;
                        }
                    }
                    dropdownChanged(feature);
                    feature.disabled = feature.options.length < 2;
                    break;

                case 'DISPLAY_ENABLE':
                case 'STATUS_LIGHT_ENABLE':
                    while(feature.firstElementChild !== feature.lastElementChild)
                        feature.removeChild(feature.lastElementChild);

                    for(const opt of feature.privateData.options) {
                        if(opt.name != 'Disabled' && hasResources(caps, opt.resources)) {
                            const ddo = addDropdownOption(feature, opt.name, makeSymbol(opt.symbol));
                            ddo.privateData2 = opt;
                        }
                    }
                    dropdownChanged(feature);
                    feature.disabled = feature.options.length < 2;
                    break;

                case 'MACROS_ENABLE':
                    while(feature.firstElementChild !== feature.lastElementChild)
                        feature.removeChild(feature.lastElementChild);

                    for(const opt of feature.privateData.options) {
                        if(opt.name != 'Disabled' && (opt.symbol.value == 1 || !document.getElementById('KEYPAD_ENABLE').disabled)) {
                            const ddo = addDropdownOption(feature, opt.name, makeSymbol(opt.symbol));
                            ddo.privateData2 = opt;
                        }
                    }
                    dropdownChanged(feature);
                    feature.disabled = feature.options.length < 2;
                    break;

                case 'WEBUI_ENABLE':
                    webuiDisable(!hasResources(caps, feature.privateData.resources));
                    break;

                case 'EMBROIDERY_ENABLE':
                    if((feature.disabled = !hasResources(caps, feature.privateData2.resources)))
                        feature.checked = false;
                    checkboxChanged(feature);
                    break;

                default:
                    if(tab.tab_id == 4) {
                        if(feature.privateData2) {
                            if((feature.disabled = !hasResources(caps, feature.privateData2.resources)))
                                feature.checked = false;
                            checkboxChanged(feature);
                        }
                    }
                    break;
            }
        }
    }

	if(variant)
		variants.onchange();
}

drivers.onchange = function()
{
    var driver = this.options[this.selectedIndex].privateData;

    if(driver == undefined) {

        for(const tab of data.tabs) {
            if(tab.div) {
                container.removeChild(tab.div);
                tab.div = null;
            }
            tab.btn.disabled = true;
        }

        while (boards.hasChildNodes())
            boards.removeChild(boards.lastChild);

        addDropdownOption(boards, na);

        urlbtnSet('driver_url', '');
        urlbtnSet('board_url', '');
        urlbtnSet('board_map_url', '');
        generateEnable(false);

    } else {

        var url = driver.driverURL.match('github.com') ? driver.driverURL.replace('github.com', 'raw.githubusercontent.com') + '/master' : driver.driverURL;

        fetch(url + '/driver.json' + '?t=' + Math.round(new Date().getTime() / 1000))
        .then(successResponse => {
                return successResponse.status == 200 ? successResponse.json() : null;
            },
            failResponse => {
                return null;
            }
        )
        .then(result => driverSelected(driver, result));
    }
}

boards.onchange = function()
{
		axisletters_clear(); console.log("1");

    boardSelected(boards[this.selectedIndex].privateData);
}

vendors.onchange = function()
{
	var vendor = this.options[this.selectedIndex].privateData;

    if(vendor == undefined) {

        while(machines.hasChildNodes())
            machines.removeChild(machines.lastChild);

        while(variants.hasChildNodes())
            variants.removeChild(variants.lastChild);

        addDropdownOption(machines, na);
        addDropdownOption(variants, na);

        urlbtnSet('vendor_url', '');
        urlbtnSet('machine_url', '');

	} else {

        urlbtnSet('vendor_url', vendor.vendorURL);

        var url = vendor.profilesURL.match('github.com') ? vendor.profilesURL.replace('github.com', 'raw.githubusercontent.com') + 'refs/heads/main' : vendor.profilesURL;

        fetch(url + '/profiles.json' + '?t=' + Math.round(new Date().getTime() / 1000))
        .then(successResponse => {
                return successResponse.status == 200 ? successResponse.json() : null;
            },
            failResponse => {
                return null;
            }
        )
        .then(result => vendorSelected(vendor, result));
    }
}

machines.onchange = function()
{
    machineSelected(machines[this.selectedIndex].privateData);
}

variants.onchange = function()
{
	const driver = getDriver();

	var opts = {};

	opts.symbols = new Array();
	symbolsToArray(variants[this.selectedIndex].privateData.default_symbols, opts.symbols);

	loadBoard(driver, opts);

 //   console.log(variants[this.selectedIndex].privateData);
	/*
	    if(board_idx == 0 && drivers.selectedIndex > 0 && uri_board !== undefined) {
        for(var board of document.getElementById('boards')) {
            if(board.value == uri_board || board.privateData.symbol == uri_board)
                board_idx = board.index;
        }
        uri_board = undefined;
    }

    boards.selectedIndex = board_idx;
	*/
}

function symbolsToArray(source, target)
{
	if(source)
        Object.keys(source).forEach(key => { target.push(`${source[key]}` === '' ? `${key}` : `${key}` + '=' + `${source[key]}`) });
}

function createSelection ()
{
    var driver = getDriver();
    var board = getBoard();
	var variant = getVariant();
    var caps = getBoardCaps(board);
    var build = {};
    var spindlem = false;
	var control_inputs = 0;
	var estop_enable = false;
    var symbols = Array(), pio_env = Array(), thirdparty = Array(), spindles = Array(), my_plugin = Array(), cmake_args = Array();
	var axisletters = axisletters_get()

    checkResources();

    if(driver.symbols) {
        const dsymbols = Object.keys(driver.symbols)
        dsymbols.forEach(key => { symbols.push(`${driver.symbols[key]}` === '' ? `${key}` : `${key}` + '=' + `${driver.symbols[key]}`) });
    }

    if(getNetworking() && getNetworking().selectedIndex > 0 && driver.symbols_networking)
    {
        const nsymbols = Object.keys(driver.symbols_networking)
        nsymbols.forEach(key => { symbols.push(`${driver.symbols_networking[key]}` === '' ? `${key}` : `${key}` + '=' + `${driver.symbols_networking[key]}`) });
    }

    if(board.symbols) {
        const bsymbols = Object.keys(board.symbols)
        bsymbols.forEach(key => { symbols.push(`${board.symbols[key]}` === '' ? `${key}` : `${key}` + '=' + `${board.symbols[key]}`) });
    }

	if(variant) {
		symbolsToArray(variant.setting_defaults, symbols);
		symbolsToArray(variant.setting_defaults_trinamic, symbols);
	}

	axisletters.forEach(symbol => { symbols.push(symbol) });

    if(board.pio_env) {
        const bsymbols = Object.keys(board.pio_env)
        bsymbols.forEach(key => { pio_env.push({ 'name': `${board.pio_env[key]}`, 'URL': '' }) });
    }

    if(board.cmake_args) {
        const bsymbols = Object.keys(board.cmake_args)
        bsymbols.forEach(key => { cmake_args.push(`${board.cmake_args[key]}` === '' ? `${key}` : `${key}` + '=' + `${board.cmake_args[key]}`) });
    }

    for(const tab of data.tabs) {

        const elems = tab.div.getElementsByTagName('*');

        for(var el of elems) {

            switch(el.type) {

    //            case 'input':
                case 'checkbox':
                    if(!el.disabled) {
                        if(el.checked === true) {
                            if(el.id == 'N_SYS_SPINDLE')
                                spindlem = true;
                            else if(el.id == 'ESTOP_ENABLE')
                                estop_enable = true;
                            else if(el.id == 'PROBE_RELAYS')
                                continue;
							else if(el.id.startsWith('CONTROL_ENABLE_'))
								control_inputs |= el.privateData2.symbols[0].value;
							else if(el.id == 'PROBE_ENABLE') {
								const relays = document.getElementById('PROBE_RELAYS');
								symbols.push(el.id + '=' + (relays && relays.checked ? 2 : 1));
							} else if(el.privateData)
                                symbols.push(el.privateData);
                            else if(!(el.privateData2 && el.privateData2.symbol && el.privateData2.symbol.hide === 1))
                                symbols.push(el.id + '=1');
                            if(el.privateData2) {
                                if(el.privateData2.pio_env)
                                    pio_env.push({ 'name': el.privateData2.id, 'URL': el.privateData2.URL });
                                if(el.privateData2.thirdparty)
                                    thirdparty.push(el.privateData2.URL);
                                if(el.privateData2.symbols && el.privateData2.symbols.length) {
									for(const symbol of el.privateData2.symbols) {
										if(symbol.hide !== 1)
											symbols.push(symbol.name + '=' + symbol.value);
									}
                                }
                            }
                        } else if(el.id == 'ESTOP_ENABLE' || el.id == 'PROBE_ENABLE') // todo: add privateData2 from drivers.json property instead of el.id == 'ESTOP_ENABLE'
                            symbols.push(el.id + '=0');
                    } else if(el.id == 'PROBE_ENABLE') // todo: add privateData2 from drivers.json property instead of el.id == 'ESTOP_ENABLE'
                        symbols.push(el.id + '=0');
                    break;

                case 'select-one':
                    const opt = el.options[el.selectedIndex];

                    if(el.privateData && el.privateData.thirdparty || opt.privateData2 && opt.privateData2.thirdparty) {

                        if(el.selectedIndex > 0) {
                            thirdparty.push(el.privateData.btn.url);
                            if(opt.privateData2) {
                                if(opt.privateData2.symbols && opt.privateData2.symbols.length) {
                                    for(var i = 0; i < opt.privateData2.symbols.length; i++) {
                                        if(opt.privateData2.symbols[i].value)
                                            symbols.push(opt.privateData2.symbols[i].name + '=' + opt.privateData2.symbols[i].value);
                                        else
                                            symbols.push(opt.privateData2.symbols[i].name);
                                        if(opt.privateData2.symbols[i].name == 'ADD_MY_PLUGIN')
                                            my_plugin.push(el.privateData.btn.url);
                                    }
                                } else if(opt.privateData2.symbol)
                                    symbols.push(opt.privateData2.symbol.name + '=' + opt.privateData2.symbol.value);
                            }
                        }
                    } else if((!el.disabled || (el.id == 'TRINAMIC_ENABLE' || (el.id == 'EEPROM_ENABLE') && el.selectedIndex > 0) ||
                                 el.id == 'TRINAMIC_MODE' || el.id == 'USB_SERIAL_CDC') && opt.privateData) {
						const symbol = opt.privateData.split('=');
                        switch(symbol[0]) {

                            case 'SPINDLE0_ENABLE':
                            case 'SPINDLE1_ENABLE':
                            case 'SPINDLE2_ENABLE':
                            case 'SPINDLE3_ENABLE':
								if(symbol[1] != 0 && !spindles.includes(symbol[1]) && spindles.length < 4)
                                    spindles.push(symbol[1]);
                                if(symbol[0] == 'SPINDLE0_ENABLE' && spindles.includes('17'))
                                    spindles.push('11'); // add SPINDLE_PWM0 if SPINDLE_PWM0_CLONE is selected
                                break;

							case 'MODBUS_BAUDRATE':
                                if(opt.privateData != 'MODBUS_BAUDRATE=-1') {
									const modbusdir = document.getElementById('MODBUS_DIR_AUX');
                                    symbols.push(el.id + '=' + (modbusdir.checked ? '3' : '1'));
                                    symbols.push(opt.privateData);
                                }
                                break;

                            case 'EEPROM_ENABLE':
                                symbols.push(symbol[0] + '=' + Math.abs(symbol[1]));
                                if(el.disabled) {
                                    var fram = document.getElementById('EEPROM_IS_FRAM');
                                    if(fram && fram.disabled && fram.checked)
                                        symbols.push('EEPROM_IS_FRAM=1');
                                }
                                break;

                            case 'TRINAMIC_ENABLE':
                                symbols.push(opt.privateData);
                                if(el.privateData2.tmc_options[el.selectedIndex].trinamic_r_sense !== undefined)
                                    symbols.push('TRINAMIC_R_SENSE=' + el.privateData2.tmc_options[el.selectedIndex].trinamic_r_sense);
                                else if(el.privateData2.tmc_options[el.selectedIndex].trinamic_r_ref !== undefined)
                                    symbols.push('TRINAMIC_R_REF=' + el.privateData2.tmc_options[el.selectedIndex].trinamic_r_ref);
                                break;

                            case 'TRINAMIC_MODE':
                                // ignore
                                break;

                            case 'WIFI_ENABLE':
                                if(el.selectedIndex > 0) {
                                    symbols.push(opt.privateData);
                                    pio_env.push({ 'name': 'wifi_networking', 'URL': '' });
                                }
                                break;

                            case 'ETHERNET_ENABLE':
                                if(el.selectedIndex > 0) {
                                    symbols.push(opt.privateData);
                                    pio_env.push({ 'name': 'eth_networking', 'URL': '' });
                                }
                                break;

                                case 'N_EVENTS':
                                    symbols.push('EVENTOUT_ENABLE=1');
                                    symbols.push(opt.privateData);
                                    break;

                            case '_WIZCHIP_':
                                if(el.selectedIndex > 0) {
                                    symbols.push(opt.privateData);
                                    symbols.push('ETHERNET_ENABLE=1');
                                    pio_env.push({ 'name': 'wiznet_networking', 'URL': '' });
                                }
                                break;

                            default:
                                symbols.push(opt.privateData);
                                break
                        }

                        if(opt.privateData2 && opt.privateData2.symbols) {
                            for(let symbol of opt.privateData2.symbols)
                                symbols.push(makeSymbol(symbol));
                        }
                    }
                    break;
            }
        }
    }

	if((control_inputs & 1) && estop_enable) {
		control_inputs &= ~1;
		control_inputs |= (1<<6);
	}

	symbols.push('CONTROL_ENABLE=' + control_inputs);

	if(spindles.length > 0) {
        for(let spindle in spindles) {
            symbols.push('SPINDLE' + spindle + '_ENABLE=' + spindles[spindle]);
        }
		if(spindles.includes('-1'))
            symbols.push('N_SPINDLE=' + (document.getElementById('SPINDLE0_ENABLE').options.length - 1).toString());
        else {
            symbols.push('N_SPINDLE=' + spindles.length);
            if(spindlem && spindles.length > 1)
                symbols.push('N_SYS_SPINDLE=' + spindles.length);
        }
	}

    build['driver'] = driver.folder;
    if(caps.build_dir)
        build['build_dir'] = caps.build_dir;
    build['URL'] = driver.driverURL;
    build['board'] = board.symbol;
    if(is_dev)
        build['developer'] = is_dev;
    if(caps.ldscript)
        build['ldscript'] = caps.ldscript;
    if(caps.pio_board)
        build['pio_board'] = caps.pio_board;
    if(pio_env.length)
        build['pio_env'] = pio_env;
    if(cmake_args.length)
        build['cmake_args'] = cmake_args;
    if(thirdparty.length)
        build['thirdparty'] = thirdparty;
    if(my_plugin.length)
        build['my_plugin'] = my_plugin;
    build['symbols'] = symbols;

    if(setting_defaults.length)
        build['setting_defaults'] = setting_defaults;

    build['docker_instance'] = driver.docker_instance ? '/' + driver.docker_instance : '';

    return build;
}

function saveSelection ()
{
    const build = createSelection();

    if(build.build_dir)
        delete build.build_dir;

    if(build.ldscript)
        delete build.ldscript;

    if(build.pio_board)
        delete build.pio_board;

    if(build.pio_env)
        delete build.pio_env;

    if(build.cmake_args)
        delete build.cmake_args;

    if(build.thirdparty)
        delete build.thirdparty;

    build['grblHAL'] = 'webBuilder';

    download(JSON.stringify(build), build.driver + '_' + build.board.replace('BOARD_', '') + '.json', 'application/json');
}

function loadBoard (driver, opts, result)
{
	var no_macros = false, no_events = false;
    var symbols = new Array();

	opts.symbols.forEach(value => { symbols.push(value) } );

	if(result) {

		var ok = false, has_eeprom = false, eeprom_new_size = 0, eeprom_index = 0;

		if(result) for(var i = 0; i < result.boards.length; i++) {
			if((ok = result.boards[i].symbol == opts.board)) {
				driverSelected(driver, result, i);
				break;
			}
		}

		if(!ok) {
			alert('Bad file!');
			return;
		}

		if(!symbols.includes('PROBE_ENABLE=1'))
			symbols.push('PROBE_ENABLE=0');

		var al = {};
		symbols.forEach(symbol => {
			var d = symbol.split('=');
			if(d[0].endsWith('_LETTER'))
				al[d[0]] = d[1];
		});

		symbols.forEach((key, index) => {
			switch(key.split('=')[0]) {
				case 'EEPROM_ENABLE':
					const size = key.split('=')[1];
					if(size <= 4) {
						eeprom_index = index;
						eeprom_new_size = size == 1 ? 16 : (size == 2 ? 64 : (size == 3 ? 32 : 128));
					}
					has_eeprom = true;
					break;
			}
		});

		if(!has_eeprom) {
			symbols.push('EEPROM_ENABLE');
		} else if(eeprom_new_size) {
			// update from legacy size
			symbols.splice(eeprom_index, 1);
			symbols.push('EEPROM_ENABLE=' + eeprom_new_size.toString());
		}
	} else {

		const caps = getBoardCaps(getBoard());

		for(var symbol of symbols) {

			const xx = symbol.split('=');

			switch(xx[0]) {

				case 'SPINDLE0_ENABLE':
				case 'SPINDLE1_ENABLE':
				case 'SPINDLE2_ENABLE':
				case 'SPINDLE3_ENABLE':
					var spindle_ok = false;
					switch(getSpindleType(parseInt(xx[1]))) {

						case spindle_type.PWM0:

							spindle_ok = caps.spindle_pwm >= 1;
							break;

						case spindle_type.PWM1:
							spindle_ok = caps.spindle_pwm >= 2;
							break;

						case spindle_type.VFD:
							spindle_ok = caps.modbus;
							break;
					}
					if(!spindle_ok)
						symbols[symbols.indexOf(symbol)] = xx[0] + '=0';
					break;

				case 'N_MACROS':
					if((no_macros = caps.digital_in < parseInt(xx[1])))
						symbols[symbols.indexOf(symbol)] = 'N_MACROS=0';
					break;

				case 'N_EVENTS':
					if((no_events = caps.digital_out < parseInt(xx[1])))
						symbols[symbols.indexOf(symbol)] = 'N_EVENTS=0';
					break;
			}
		}
	}

    if(opts.setting_defaults)
        opts.setting_defaults.forEach(value => { setting_defaults.push(value) } );

    for(const tab of data.tabs) {

        const elems = tab.div.getElementsByTagName('*');

        for(var feature of elems) {

            for(var symbol of symbols) {

                switch(feature.type) {

                    case 'checkbox':
                        const xx = symbol.split('=');
                        if(feature.id === xx[0] && !feature.disabled) {
                            feature.checked = xx.length > 1 && xx[1] != 0;
                            checkboxChanged(feature);
                        }
                        break;

                    case 'select-one':
						if(!feature.disabled) {
							if(feature.options[0].privateData === undefined && symbols.includes(feature.id)) {
								feature.selectedIndex = 0;
								dropdownChanged(feature);
							}

							if(!result) switch(feature.id) {

								case 'MACROS_ENABLE':
									if(no_macros)
										symbol = 'MACROS_ENABLE=0';
									break;

								case 'NETWORKING_ENABLE':
									symbol = feature.options[1].privateData;
									break;
							}

							for(var i = 0; i < feature.options.length; i++) {
								if(feature.options[i].privateData === symbol ||
								   (symbol == 'ADD_MY_PLUGIN=1' && opts.my_plugin && feature.options[i].privateData2 && feature.options[i].privateData2.URL == opts.my_plugin)){
									feature.selectedIndex = i;
									dropdownChanged(feature);
									if(feature.id == 'N_AXIS') {
										const axes = feature.selectedIndex + 3;
										if(axes > 3 && al['AXIS' + (axes - 1).toString() + '_LETTER']) {
											axisletters_add(axes - 3);
											for(const key in al) {
												const map = document.getElementById(key);
												if(map)
													map.selectedIndex = axisletters.indexOf(al[key][1]) - (6 - map.options.length);
											}
										}
									}
									break;
								}
							}
						}
                        break;
                }
            }
        }
    }
}

function loadSelection ()
{
	var input = document.createElement('input');
	input.type = 'file';
    input.accept = '.json';
	input.style.display = 'none';
	input.onchange = function(e) {
        if(!e.target.files[0])
            return;
        const reader = new FileReader();
        reader.onload = function(e) {
            const opts = JSON.parse(e.target.result);
            const drivers = document.getElementById('drivers');

            for(var i = 1; i < drivers.options.length; i++) {
                if(drivers.options[i].privateData.driverURL == opts.URL)
                    drivers.selectedIndex = i;
            }

            const driver = document.getElementById('drivers').options[drivers.selectedIndex].privateData;
            const url = opts.URL.match('github.com') ? opts.URL.replace('github.com', 'raw.githubusercontent.com') + '/master' : opts.URL;

            fetch(url + '/driver.json' + '?t=' + Math.round(new Date().getTime() / 1000))
            .then(successResponse => {
                    return successResponse.status == 200 ? successResponse.json() : null;
                },
                failResponse => {
                    return null;
                }
            )
            .then(result => loadBoard(driver, opts, result));
        }
        reader.readAsText(e.target.files[0]);
	}
	document.body.appendChild(input);
	input.click();
    setTimeout(function() {
        document.body.removeChild(input);
    }, 0);
}

function getFiletype (mimetype)
{
    switch(mimetype) {

        case 'application/octet-stream':
            mimetype = 'bin';
            break;

        case 'application/vnd.ufdl':
            mimetype = 'uf2';
            break;

        case 'application/x-zip-compressed':
            mimetype = 'zip';
            break;

        default:
            mimetype = 'hex';
            break;
    }

    return mimetype;
}


function generateBinary ()
{
    const build = createSelection();

console.log('----------');

    if(build.my_plugin)
        delete build.my_plugin;

    console.log(build);
//return;

    var width = 0;
    progressbar.parentNode.style.display = 'block';
    var id = setInterval(function () {
        if (width >= 100)
            width = 0;
        else
            width++;
        progressbar.style.width = width + '%';
    }, 25);

    generateEnable(false);

    let xhr = new XMLHttpRequest();
    xhr.open('POST', window.location.origin + '/builder' + build.docker_instance);
    xhr.responseType = 'blob';
    xhr.setRequestHeader('Accept', 'application/octet-stream');
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.timeout = 5 * 60 * 1000;
    xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
        clearInterval(id);
        progressbar.parentNode.style.display = 'none';
        generateEnable(true);
        if(xhr.status == 200) {
            var type = xhr.getResponseHeader('Content-Type');
            download(xhr.response, 'firmware.' + getFiletype(type), type);
        } else {
            if(xhr.status == 422) {
                const reader = new FileReader();
                reader.readAsText(xhr.response);
                reader.onload = function() {
                    const div = document.getElementById('report');
                    div.innerText = reader.result;
                    div.style.display = 'block';
                };
            }
            alert('Build failed: ' + xhr.status);
        }
    }};
    xhr.send(JSON.stringify(build));
}

function urlbtnSet (id, url)
{
    const urlbtn = document.getElementById(id);
    urlbtn.URL = url;
    urlbtn.disabled = url === '';
}

function axisoptEnable (symbol, disabled)
{
    var axis = document.getElementById(symbol);
    if((axis.disabled = disabled)) {
        axis.selectedIndex = 0;
		dropdownChanged(axis);
	}
}

function webuiDisable (disable = undefined)
{
    const webui = document.getElementById('WEBUI_ENABLE');
    if(webui) {
        webui.selectedIndex = 0;
        dropdownChanged(webui);
        if(typeof disable !== 'undefined')
            webui.disabled = disable;
    }
}

function getNetworking ()
{
    return document.getElementById('NETWORKING_ENABLE');
}

function getPlugin (symbol)
{
    for(let plugin of data.plugins) {
        if(plugin.symbol.name == symbol)
            return plugin;
    }

    return undefined;
}

function hasPlugin (caps, name)
{
    // TODO: fix when driver.json files are updated for hc05 available
    var drivers = document.getElementById('drivers');
    var driver = drivers[drivers.selectedIndex].privateData;

    return (name == 'hc05' && driver.name != 'ESP32' && caps.plugins.find(plugin => plugin.id == 'bluetooth') != undefined) || caps.plugins.find(plugin => plugin.id == name) != undefined;
}

function getDriverProperties ()
{
    const drivers = document.getElementById('drivers');
    var properties = drivers.options[drivers.selectedIndex].privateData;

    default_caps.forEach(cap => {

        if(!properties.caps.hasOwnProperty(cap.key)) switch(cap.key) {

            case 'control_inputs':
                properties.caps[cap.key] = monitor[cap.key].driver = 3;
                break;

            case 'axes':
                properties.caps[cap.key] = 3;
                break;

            case 'hc05':
                properties.caps[cap.key] = hasPlugin(properties.caps, cap.key) ? 1 : 0;
                break;

            case 'i2c_ports':
                properties.caps[cap.key] = (properties.caps.hasOwnProperty('i2c_strobe') && properties.caps.i2c_strobe) ? 1 : 0;
                break;

/*
            case 'i2c':
                properties.caps[cap.key] = properties.caps.plugins.find(plugin => plugin.id == 'eeprom') != undefined ||
                                            (properties.caps.hasOwnProperty('i2c_strobe') && properties.caps['i2c_strobe']) ? 1 : 0;
                break;
*/
            case 'modbus':
                properties.caps[cap.key] = hasPlugin(properties.caps, 'spindle') ? 1 : 0;
                break;

            case 'eeprom':
                properties.caps['i2c'] = properties.caps.plugins.find(plugin => plugin.id == cap.key) != undefined ? 1 : 0;
            case 'sdcard':
                properties.caps[cap.key] = properties.caps.plugins.find(plugin => plugin.id == cap.key) != undefined ? 1 : 0;
                break;

            default:
                properties.caps[cap.key] = 0;
                break;
        }
    });

    monitor['auto_square'].driver = 3;
    monitor['axes'].driver = monitor['motors'].driver = properties.caps['axes'];
	if(monitor['axes'].used == 0)
		monitor['axes'].used = 3;

    return properties;
}

function getDriver ()
{
	const drivers = document.getElementById('drivers');

	return drivers.options[drivers.selectedIndex].privateData;
}

function getVariant ()
{
	const variants = document.getElementById('variants');

	return variants.options[variants.selectedIndex].privateData;
}

function getBoard ()
{
	var boards = document.getElementById('boards');

	return boards[boards.selectedIndex].privateData;
}

function getBoardCaps (board)
{
    var caps = {};
    const dcaps = getDriverProperties().caps;
    const informal = dcaps.hasOwnProperty('informal');

    /*
    if(!informal) {
        Object.keys(dcaps).forEach(key => {
            if(key != 'informal')
                caps[key] = dcaps[key];
        });
    }
    */
    Object.keys(board.caps).forEach(key => {
        caps[key] = board.caps[key];
    });

    default_caps.filter(caps => caps.inherited).forEach(cap => {
        if(!caps.hasOwnProperty(cap.key))
            caps[cap.key] = dcaps.hasOwnProperty(cap.key) ? dcaps[cap.key] : 0;
    });

    default_caps.filter(caps => caps.derived).forEach(cap => {
        if(!caps.hasOwnProperty(cap.key) || caps[cap.key] == 0) switch(cap.key) {

            case 'auto_square':
                if(!caps.hasOwnProperty(cap.key))
                    caps[cap.key] = caps['motors'] > 3 ? Math.min(caps['ganged_axes'], caps['motors'] - 3) : 0;
                break;

            case 'axes':
                caps[cap.key] = 3;
                break;

            case 'i2c':
                caps[cap.key] = (caps.hasOwnProperty('eeprom') && caps.eeprom > 0) || (caps.hasOwnProperty('i2c_strobe') && caps.i2c_strobe) ? 1 : 0;
                break;

            case 'i2c_ports':
                caps[cap.key] = (caps.hasOwnProperty('i2c_strobe') && caps.i2c_strobe) ? 1 : 0;
                break;

//                case 'fram':
//                    caps[cap] = caps['eeprom'] > 0 ? 1 : 0;
//                    break;

            case 'ganged_axes':
                if(!caps.hasOwnProperty(cap.key))
                    caps[cap.key] = Math.max(caps['motors'] - 3, 0);
                break;

            case 'hc05':
                var serial_ports = (caps.hasOwnProperty('serial_ports') ? caps.serial_ports : 0) -
                                    (caps.hasOwnProperty('usb_cdc') && caps.usb_cdc ? 0 : 1);
                caps[cap.key] = dcaps[cap.key] && serial_ports >= 1 && caps.hasOwnProperty('digital_in') && caps.digital_in > 0 ? 1 : 0;
                break;

            case 'modbus':
                var serial_ports = (caps.hasOwnProperty('serial_ports') ? caps.serial_ports : 0) -
                                    (caps.hasOwnProperty('usb_cdc') && caps.usb_cdc ? 0 : 1);
                caps[cap.key] = serial_ports >= 1 ? 1 : 0;
                break;

            case 'motors':
                caps[cap.key] = caps['axes'];
                break;

            case 'networking':
                caps[cap.key] = caps.ethernet || caps.wifi || caps.wiznet ? 1 : 0;
                break;

            case 'serial_ports':
				if(!caps.hasOwnProperty(cap.key))
					caps[cap.key] = 1;
                break;

            case 'spindle_dir':
                caps[cap.key] = 1; //caps.pwm_spindle_aux !== 0 ? 1 : 0;
                break;

            case 'webui':
                if(!caps.hasOwnProperty(cap.key))
                    caps[cap.key] = caps.networking;
                break;
        }
    });

    default_caps.filter(caps => !caps.inherited && !caps.derived).forEach(cap => {
        if(!caps.hasOwnProperty(cap.key))
            caps[cap.key] = 0;
    });

    build_options.forEach(build_option => {
        if(dcaps.hasOwnProperty(build_option) && !caps.hasOwnProperty(build_option))
            caps[build_option] = dcaps[build_option];
    });

    return caps;
}

function checkResources ()
{
    var mismatch = false, report = '';
    const div = document.getElementById('report');
	const probe = document.getElementById('PROBE_ENABLE');

    for(var resource in monitor) {

		var board = monitor[resource].board, used = monitor[resource].used;

		if(resource == 'digital_in') {
			board += monitor['control_inputs'].board - monitor['control_inputs'].used;
			if(probe && !probe.checked)
				board += 1;
		}

        if(used > board) {
            mismatch = true;
            report += resource.toUpperCase().replace('_', ' ') + ': available ' + monitor[resource].board + ', required ' + monitor[resource].used + ".\r\n";
        }
    }

    div.innerText = report;
    div.style.display = mismatch ? 'block' : 'none';
    generateEnable(!mismatch);

    return !mismatch;
}

function hasResources (board, feature)
{
    if(typeof feature === 'undefined')
        return true;

    var ok = true;

    const required = Object.keys(feature);
    var i = required.length;

    while(i && ok) {
        var key = required[--i];
        var count = feature[key];
        if(key == 'modbus_rtu')
            key = 'serial_ports';
        if(count > 0 && (typeof board[key] != 'number' || board[key] < count))
            ok = false;
    }

    return ok;
}

function getOptionsIndex (options, value)
{
    for(var i = 0; i < options.length; i++) {
        if(options[i].symbol && options[i].symbol.value === value)
            return i;
    }

    return 0;
}

// https://stackoverflow.com/questions/13405129/create-and-save-a-file-with-javascript
function download (data, filename, type)
{
    var file = new Blob([data], {type: type});
    if (window.navigator.msSaveOrOpenBlob) // IE10+
        window.navigator.msSaveOrOpenBlob(file, filename);
    else { // Others
        var a = document.createElement('a'),
            url = URL.createObjectURL(file);
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(function() {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 0);
    }
}

function getParam(name)
{
   if(name = (new RegExp('[?&]' + encodeURIComponent(name) + '=([^&]*)')).exec(location.search))
      return decodeURIComponent(name[1]);
}

function getSpindleType (id)
{
	var type = spindle_type.uk;

	switch(id) {

		case 1:
		case 2:
		case 3:
		case 4:
		case 5:
		case 6:
		case 20:
			type = spindle_type.VFD;
			break;

		case 11:
		case 12:
			type = spindle_type.PWM0;
			break;

		case 13:
		case 14:
			type = spindle_type.PWM1;
			break;

		case 19:
			type = spindle_type.STEPPER;
			break;
	}

	return type;
}

function generateEnable (enable)
{
    document.getElementById('generate').disabled = !enable;
    const save = document.getElementById('save');
    if(save)
        save.disabled = !enable;
}

function lineUp (div)
{
    div.privateData = true;

    var el = div.firstElementChild;

    while(el) {
        if(el.tagName == 'LABEL') {
            const elp = document.getElementById(el.htmlFor);
            if(elp.type == 'select-one') {
        //console.log('dr', elp.style.width, el.style.marginLeft, el.offsetWidth, el.clientWidth, elp);
            el.style.marginLeft = parseInt(el.style.marginLeft.replace('px', '')) + parseInt(elp.style.width.replace('px', '')) + 80 - el.offsetWidth + 'px';
        //console.log('ds', el.style.marginLeft, el.offsetWidth);
            }
        }

        el = el.nextElementSibling;

        if(el && el.id == 'info') {
            const ps = el.previousElementSibling;
            if(ps.tagName == 'LABEL') {
                var elp = document.getElementById(ps.htmlFor);
 //              console.log(elp.type, el.previousElementSibling);
 //               console.log(elp.offsetWidth, elp.offsetLeft, ps.offsetWidth);
                el.style.marginLeft = (230.0 - (elp.type == 'checkbox' ? ps.offsetWidth + 16.5 : elp.offsetWidth)) + 'px';
            }
            el = el.nextElementSibling;
        }
    }
}

if(drivers.selectedIndex > 0)
    drivers.dispatchEvent(new Event('change'));
