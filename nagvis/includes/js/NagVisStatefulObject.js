/*****************************************************************************
 *
 * NagVisObject.js - This class handles the visualisation of statefull objects
 *
 * Copyright (c) 2004-2008 NagVis Project
 *
 * License:
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 2 as
 * published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 675 Mass Ave, Cambridge, MA 02139, USA.
 *
 *****************************************************************************/
 
/**
 * @author	Lars Michelsen <lars@vertical-visions.de>
 */

NagVisStatefulObject.prototype = new NagVisObject;
NagVisStatefulObject.prototype.constructor = NagVisStatefulObject;
function NagVisStatefulObject () {
	// Stores the informations from last refresh (Needed for change detection)
	this.last_conf = new Object();
	
	/**
	 * PUBLIC saveLastState()
	 *
	 * Saves the current state in last state array for later change detection
	 *
	 * @author	Lars Michelsen <lars@vertical-visions.de>
	 */
	this.saveLastState = function() {
		// FIXME: Do not copy the whole conf array
		for (i in this.conf) {
			this.last_conf[i] = this.conf[i];
		}
	}
	
	/**
	 * PUBLIC stateChanged()
	 *
	 * Check if a state change occured since last refresh
	 *
	 * @author	Lars Michelsen <lars@vertical-visions.de>
	 */
	this.stateChanged = function() {
		if(this.conf.summary_state != this.last_conf.summary_state || this.conf.summary_problem_has_been_acknowledged != this.last_conf.summary_problem_has_been_acknowledged || this.conf.summary_in_downtime != this.last_conf.summary_in_downtime) {
			return true;
		} else {
			return false;
		}
	}
	
	/**
	 * PUBLIC parse()
	 *
	 * Parses the object
	 *
	 * @return	String		HTML code of the object
	 * @author	Lars Michelsen <lars@vertical-visions.de>
	 */
	this.parse = function () {
		var oContainerDiv;
		
		this.replaceMacros();
		
		// Create container div
		oContainerDiv = document.createElement('div');
		oContainerDiv.setAttribute('id', this.objId);
		
		oAnchor = document.createElement('a');
		oAnchor.name = '#'+this.objId;
		oContainerDiv.appendChild(oAnchor);
		
		// Parse object depending on line or normal icon
		if(this.conf.line_type) {
			oContainerDiv.appendChild(this.parseLine());
		} else {
			oContainerDiv.appendChild(this.parseIcon());
		}
		
		// Parse label when configured
		if(this.conf.label_show && this.conf.label_show == '1') {
			oContainerDiv.appendChild(this.parseLabel());
		}
		
		// When this is an update, remove the object first
		if(this.parsedObject) {
			document.getElementById('map').removeChild(this.parsedObject);
		}
		this.parsedObject = document.getElementById('map').appendChild(oContainerDiv);
	}
	
	/**
	 * Replaces macros of urls and hover_urls
	 *
	 * @author 	Lars Michelsen <lars@vertical-visions.de>
	 */
	this.replaceMacros = function () {
		if(this.conf.type == 'service') {
			name = 'host_name';
		} else {
			name = this.conf.type + '_name';
		}
		
		if(this.conf.url && this.conf.url != '') {
			this.conf.url = this.conf.url.replace('['+name+']', this.conf.name);
			if(this.type == 'service') {
				this.conf.url = this.conf.url.replace('[service_description]', this.conf.service_description);
			}
		}
		
		if(this.conf.hover_url && this.conf.hover_url != '') {
			this.conf.hover_url = this.conf.hover_url.replace('['+name+']', this.conf.name);
			if(this.conf.type == 'service') {
				this.conf.hover_url = this.conf.hover_url.replace('[service_description]', this.conf.service_description);
			}
		}
		
		if(this.conf.label_text && this.conf.label_text != '') {
			// For maps use the alias as display string
			if(this.conf.type == 'map') {
				name = 'alias';   
			}
			
			this.conf.label_text = this.conf.label_text.replace('[name]', this.conf.name);
			this.conf.label_text = this.conf.label_text.replace('[output]', this.conf.output);
			
			if(this.conf.type == 'service' || this.conf.type == 'host') {
				this.conf.label_text = this.conf.label_text.replace('[perfdata]', this.conf.perfdata);
			}
			
			if(this.conf.type == 'service') {
				this.conf.label_text = this.conf.label_text.replace('[service_description]', this.conf.service_description);
			}
		}
	}
	
	/**
	 * Parses the HTML-Code of a line
	 *
	 * @return	String		HTML code
	 * @author	Lars Michelsen <lars@vertical-visions.de>
	 */
	this.parseLine = function () {
		var ret = '';
		var link = '';
		
		var x = this.conf.x.split(',');
		var y = this.conf.y.split(',');
		
		var width = 3;
		
		if(this.type == 'service') {
			alt = this.conf.name+'-'+this.conf.service_description;
		} else {
			alt = this.conf.name;
		}
		
		// Create container div
		oContainerDiv = document.createElement('div');
		
		// Create line div
		var oLineDiv = document.createElement('div');
		oLineDiv.setAttribute('id', this.objId+'-line');
		oLineDiv.style.zIndex = this.conf.z;
		
		// Add link to the line
		oLineDiv.onclick = new Function('window.open("'+this.conf.url+'","'+this.conf.url_target+'","");');
		
		oContainerDiv.appendChild(oLineDiv);
		
		// Create line border div
		var oLineBorderDiv = document.createElement('div');
		oLineBorderDiv.setAttribute('id', this.objId+'-border');
		oLineBorderDiv.style.zIndex = this.conf.z;
		oContainerDiv.appendChild(oLineBorderDiv);
		
		// Add the container to dom
		document.getElementById('map').appendChild(oContainerDiv);
		
		// Parse the line object
		drawNagVisLine(this.objId, this.conf.line_type, x[0], y[0], x[1], y[1], width, this.conf.summary_state, this.conf.summary_problem_has_been_acknowledged, this.conf.summary_in_downtime);
		
		// Create hover menu
		this.getHoverMenu(oLineDiv);
		
		return oContainerDiv;
	}
	
	/**
	 * PUBLIC parseIcon()
	 *
	 * Parses the HTML-Code of an icon
	 *
	 * @return	String		String with Html Code
	 * @author	Lars Michelsen <lars@vertical-visions.de>
	 */
	this.parseIcon = function () {
		if(this.type == 'service') {
			alt = this.conf.name+'-'+this.conf.service_description;
		} else {
			alt = this.conf.name;
		}
		
		var oIcon = document.createElement('img');
		oIcon.setAttribute('id', this.objId+'-icon');
		oIcon.src = this.conf.iconHtmlPath+this.conf.icon;
		oIcon.alt = this.conf.type+'-'+alt;
		
		this.getHoverMenu(oIcon);
		
		var oIconLink = document.createElement('a');
		oIconLink.href = this.conf.url;
		oIconLink.target = this.conf.url_target;
		oIconLink.appendChild(oIcon);
		
		var oIconDiv = document.createElement('div');
		oIconDiv.setAttribute('id', this.objId+'-icondiv');
		oIconDiv.setAttribute('class', 'icon');
		oIconDiv.setAttribute('className', 'icon');
		oIconDiv.style.position = 'absolute';
		oIconDiv.style.top = this.conf.y+'px';
		oIconDiv.style.left = this.conf.x+'px';
		oIconDiv.style.zIndex = this.conf.z;
		oIconDiv.appendChild(oIconLink);
		
		return oIconDiv;
	}
	
	/**
	 * Parses the HTML-Code of a label
	 *
	 * @return	String		HTML code of the label
	 * @author	Lars Michelsen <lars@vertical-visions.de>
	 */
	this.parseLabel = function () {
		var oLabelDiv;
		
		// If there is a presign it should be relative to the objects x/y
		if(this.conf.label_x.toString().match(/^(?:\+|\-)/)) {
			this.conf.label_x = parseFloat(this.conf.x) + parseFloat(this.conf.label_x);
		}
		if(this.conf.label_y.toString().match(/^(?:\+|\-)/)) {
			this.conf.label_y = parseFloat(this.conf.y) + parseFloat(this.conf.label_y);
		}
		
		// If no x/y coords set, fallback to object x/y
		if(!this.conf.label_x || this.conf.label_x == '' || this.conf.label_x == 0) {
			this.conf.label_x = this.conf.x;
		}
		if(!this.conf.label_y || this.conf.label_y == '' || this.conf.label_y == 0) {
			this.conf.label_y = this.conf.y;
		}
		
		if(this.conf.label_width && this.conf.label_width != 'auto') {
			this.conf.label_width += 'px';	
		}
		
		oLabelDiv = document.createElement('div');
		oLabelDiv.setAttribute('id', this.objId+'-label');
		oLabelDiv.setAttribute('class', 'object_label');
		oLabelDiv.setAttribute('className', 'object_label');
		oLabelDiv.style.background=this.conf.label_background;
		oLabelDiv.style.borderColor=this.conf.label_border;
		
		oLabelDiv.style.position = 'absolute';
		oLabelDiv.style.left = this.conf.label_x+'px';
		oLabelDiv.style.top = this.conf.label_y+'px';
		oLabelDiv.style.width = this.conf.label_width;
		oLabelDiv.style.zIndex = this.conf.z+1;
		oLabelDiv.style.overflow= 'visible';
		
		/**
		 * IE workaround: The transparent for the color is not enough. The border
		 * has really to be hidden.
		 */
		if(this.conf.label_border == 'transparent') {
			oLabelDiv.style.borderStyle = 'none';
		} else {
			oLabelDiv.style.borderStyle = 'solid';
		}
		
		// Create span for text and add label text
		var oLabelSpan = document.createElement('span');
		oLabelSpan.appendChild(document.createTextNode(this.conf.label_text));
		oLabelDiv.appendChild(oLabelSpan);
		
		return oLabelDiv;
	}
}
