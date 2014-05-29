/* global define */
define([
	'require',

	'base/EventModulePage',

	'util/Util',
	'util/Xhr',
	'util/Events',
	'mvc/ModalView',

	'questionview/QuestionView',
	'locationview/LocationView'
], function (
	require,

	EventModulePage,

	Util,
	Xhr,
	Events,
	ModalView,

	QuestionView,
	LocationView
) {
	'use strict';

	var DEFAULTS = {
		language: 'en' // English
	};

	var ID_INCREMENT = 0;

	var SUPPORTED_LANGUAGES = ['en'];

	var DYFIFormPage = function (options) {
		this._options = Util.extend({}, DEFAULTS, options || {});
		this._dialog = null;
		this._dyfiIframe = null;

		if (SUPPORTED_LANGUAGES.indexOf(this._options.language) === -1) {
			this._options.language = DEFAULTS.language;
		}

		this._updateSubmitEnabled = this._updateSubmitEnabled.bind(this);
		EventModulePage.call(this, this._options);
	};
	DYFIFormPage.prototype = Object.create(EventModulePage.prototype);

	DYFIFormPage.prototype.destroy = function () {
		Events.prototype.off.call(this._questions.ciim_mapLat, 'change',
				this._updateSubmitEnabled);
		Events.prototype.off.call(this._questions.ciim_mapLon, 'change',
				this._updateSubmitEnabled);
		this._questions.fldSituation_felt.off('change', this._updateSubmitEnabled);

		if (this._dialog && this._dialog.destroy &&
				typeof this._dialog.destroy === 'function') {
			this._dialog.destroy();
		}

		this._dialog = null;
	};

	DYFIFormPage.prototype._setHeaderMarkup = function () {
		this._header.innerHTML = '<h2>Did you feel it? Tell Us!</h2>';
	};

	/**
	 * Content is already generated in the _setContentMarkup method. This method
	 * returns that created markup, however since this is a ModalView form of a
	 * page, this page must manually show the form again.
	 *
	 */
	DYFIFormPage.prototype.getContent = function () {
		this._showForm();
		return EventModulePage.prototype.getContent.apply(this, arguments);
	};

	DYFIFormPage.prototype._setContentMarkup = function () {
		// TODO :: Make this better.
		this._content.innerHTML = '<div class="dyfiform-content">' +
				'A dialog should automatically appear&hellip;<div>';

	};

	DYFIFormPage.prototype._showForm = function () {
		var _this = this;

		if (this._dialog === null) {
			this._fetchDialog(function () {
				_this._showForm();
			});
		} else if (this._dialog === 'pending') {
			// Already fetching labels via XHR from previous call, but not ready yet.
			// Just wait until ready. XHR will attempt to open when ready.
		} else {
			// Show form if ready
			_this._dialog.show();
		}
	};

	DYFIFormPage.prototype._hideForm = function () {
		this._dialog.hide();
		window.history.go(-1);
	};

	DYFIFormPage.prototype._updateSubmitEnabled = function () {
		var questions = this._questions,
		    latAns = questions.ciim_mapLat.getAnswers(),
		    lonAns = questions.ciim_mapLon.getAnswers(),
		    feltAns = questions.fldSituation_felt.getAnswers(),
		    button = this._dialog._el.querySelector('.dyfi-button-submit');

			// Check current form status. Enable/disable button
			if (latAns === null || typeof latAns.value === 'undefined' ||
					lonAns === null || typeof lonAns.value === 'undefined' ||
					feltAns === null || typeof feltAns.value === 'undefined') {
				button.setAttribute('disabled', 'disabled');
			} else {
				button.removeAttribute('disabled');
			}
	};

	DYFIFormPage.prototype._onSubmit = function (/*event*//*, domElement*/) {
		var eventData;
		var contentdiv;

		eventData = _collectAnswers(this);

		//TODO move this to DYFIFormPage
		contentdiv = document.querySelector('.dyfiform-content');
		this._dyfiIframe = document.createElement('iFrame');
		this._dyfiIframe.name = 'resultFrame';
		this._dyfiIframe.id = 'resultFrame';
		this._dyfiIframe.className = 'dyfiIframe';
		/*this._dyfiIframe.width = '100%';
		this._dyfiIframe.height = '400px';
		this._dyfiIframe.border = '0';
		this._dyfiIframe.frameBorder = '0';*/

		contentdiv.innerHTML = '';
		contentdiv.appendChild(this._dyfiIframe);

		this._dyfiHiddenForm = _createHiddenDYFIForm(eventData);
		document.body.appendChild(this._dyfiHiddenForm);
		this._dyfiHiddenForm.submit();

		this._dialog.hide();
	};

	DYFIFormPage.prototype._onCancel = function (/*event*//*, domElement*/) {
		this._hideForm();
	};

		//Collect answers from questionViews into an object.
	//Make certain properties required by response.php are included.
	var _collectAnswers = function(_this) {
		var eventData = {};
		var cnt;
		var questions = _this._questions;
		var question_other;
		var answers;

		//Use the event properties passed in.
		if( _this._event.properties.hasOwnProperty('code')) {
			//if there's a code,  use the time passed in.  Otherwise it's in a question.
			eventData.timestamp = Math.floor(_this._event.properties.time/1000);

			eventData.code = _this._event.properties.code;
			eventData.network = _this._event.properties.net;
			eventData.dyficode = _this._event.properties.products.dyfi[0].code;
		//or set event properties to unknown.
		} else {
			eventData.code = 'unknown';
			eventData.network = 'unknown';
			eventData.dyficode = 'unknown';
		}

		for (var question in questions) {
			answers = questions[question].getAnswers();
			if (answers instanceof Array) {
				eventData[question] = [];
				for(cnt = 0; cnt < answers.length; cnt++) {
					eventData[question].push(answers[cnt].value);
				}
			}
			else if (answers instanceof Object && answers.value !== undefined) {
				eventData[question] = answers.value;
				if(answers.value ==='other') {
					question_other = question + '_Other';
					eventData[question_other] = answers.otherValue;
				}
			}
			else {
				eventData[question] = '';
			}
		}

		//make certain we have required properties for response.php
		//if fldSituation_felt, ciim_mapLat, & ciim_mapLon are empty
		//we want response.php to fail.
		if(!eventData.hasOwnProperty('ciim_zip'))
			{eventData.ciim_zip ='';}
		if(!eventData.hasOwnProperty('ciim_city'))
			{eventData.ciim_city ='';}
		if(!eventData.hasOwnProperty('ciim_region'))
			{eventData.ciim_region ='';}
		if(!eventData.hasOwnProperty('ciim_country'))
			{eventData.ciim_country ='';}
		//if d_text isn't an array,  get rid of it.
		if(eventData.hasOwnProperty('d_text') && !(eventData.d_text instanceof Array)) {
			delete eventData.d_text;
		}

		return eventData;
	};

	var _createInput = function(name, value) {
		var node = document.createElement('input');
		node.setAttribute('hidden', 'hidden');
		node.setAttribute('name', name);
		node.setAttribute('value', value);

		return node;
	};

	//Set up Hidden form to submit questions/answers.
	var _createHiddenDYFIForm = function(eventData) {
		var dyfiHiddenForm = document.createElement('form');
		var values;
		var cnt;

		dyfiHiddenForm.name = 'frmCiim';
		dyfiHiddenForm.method='post';
		dyfiHiddenForm.appendChild(_createInput('windowtype', 'enabled'));
		//TODO set this up to work on dev or production as appropriate.
		//dyfiHiddenForm.action='https://sslearthquake.usgs.gov/dyfi/response.php';
		dyfiHiddenForm.action='https://ehpd-sslearthquake.cr.usgs.gov/dyfi/response.php';
		dyfiHiddenForm.target='resultFrame';
		dyfiHiddenForm.id='frmCiim';
		dyfiHiddenForm.style.display = 'none';

		dyfiHiddenForm.appendChild(_createInput('code', eventData.code));
		dyfiHiddenForm.appendChild(_createInput('network', eventData.network));
		dyfiHiddenForm.appendChild(_createInput('dyficode', eventData.dyficode));
		dyfiHiddenForm.appendChild(_createInput('ciim_time', eventData.timestamp));
		//TODO get language from form if possible.
		dyfiHiddenForm.appendChild(_createInput('language', 'en'));
		//TODO get form_version from event if possible.
		dyfiHiddenForm.appendChild(_createInput('form_version', '1.3'));

		for (var data in eventData) {
			values = eventData[data];
			if (values instanceof Array) {
				for(cnt = 0; cnt < values.length; cnt++) {
					//there's got to be a better way, but for now I just append []'s.
					dyfiHiddenForm.appendChild(_createInput(data+'[]', values[cnt]));
				}
			}
			else {
				dyfiHiddenForm.appendChild(_createInput(data, values));
			}
		}

	return dyfiHiddenForm;
	};

	DYFIFormPage.prototype._fetchDialog = function (callback) {
		var _this = this;

		this._dialog = 'pending';

		// Fetch form text information (labels etc...) and then...
		Xhr.ajax({
			url: require.toUrl('impact/dyfi/' + this._options.language + '.json'),
			success: function (data) {
				// ... create the modal dialog
				_this._createDialog(data);

				// ... and show it!
				if (callback && typeof callback === 'function') {
					callback();
				}
			},
			error: function () {
				// TODO :: Update container with error message
			}
		});
	};

	DYFIFormPage.prototype._createDialog = function (data) {
		this._dialog = new ModalView(this._renderQuestions(data), {
			title: '',
			classes: ['dyfi-form'],
			closable: false,
			buttons: [
				{
					text: data.submit.label,
					classes: ['dyfi-button-submit'],
					callback: this._onSubmit.bind(this)
				},
				{
					text: 'Cancel',
					classes: ['dyfi-button-cancel'],
					callback: this._onCancel.bind(this)
				}
			]
		});

		this._updateSubmitEnabled();
	};

	DYFIFormPage.prototype._renderQuestions = function (data) {
		var fragment = document.createDocumentFragment(),
		    header = fragment.appendChild(document.createElement('header')),
		    baseQuestionsEl = fragment.appendChild(document.createElement('div')),
		    toggleContainer = fragment.appendChild(document.createElement('div')),
		    moreQuestionsEl = fragment.appendChild(document.createElement('div')),
		    contactContainer = document.createElement('div'),
		    locationInfo = data.locationInfo,
		    baseQuestions = data.baseQuestions,
		    toggleInfo = data.toggleInfo,
		    moreQuestions = data.moreQuestions,
		    contactInfo = data.contactInfo,
		    questions = {};

		baseQuestionsEl.classList.add('dyfi-required-questions');
		toggleContainer.classList.add('dyfi-optional-callout');
		moreQuestionsEl.classList.add('dyfi-optional-questions');
		contactContainer.classList.add('dyfi-contact-questions');

		header.classList.add('modal-header');
		header.innerHTML = '<h3>Felt Report</h3>';

		// Handle location question
		__create_location_questions(locationInfo, baseQuestionsEl, questions);

		// Loop over each base question and create a QuestionView
		__create_questions(baseQuestions, baseQuestionsEl, questions);

		// Visual control to show/hide moreQuestionsEl
		__create_toggle_control(toggleInfo, toggleContainer);

		// Loop over each additional question and create a QuestionView
		__create_questions(moreQuestions, moreQuestionsEl, questions);

		// Handle additional comments
		__create_text_questions(data.comments, moreQuestionsEl, questions);

		// Handle contact information
		contactContainer.innerHTML = '<h4>Contact Information' +
				'<span class="subheader">Optional</span></h4>';
		__create_text_questions(contactInfo, contactContainer, questions);
		moreQuestionsEl.appendChild(contactContainer);

		// Hold on to this for later it is now an object{field: view}
		this._questions = questions;


		// When location or felt response changes update submit button enabled
		Events.prototype.on.call(this._questions.ciim_mapLat, 'change',
				this._updateSubmitEnabled);
		Events.prototype.on.call(this._questions.ciim_mapLon, 'change',
				this._updateSubmitEnabled);
		this._questions.fldSituation_felt.on('change', this._updateSubmitEnabled);

		// TODO :: More interaction like progress meter.


		return fragment;
	};


	var __create_location_questions = function (questionInfo, container,
			questions) {
		var section = document.createElement('section'),
		    label = section.appendChild(document.createElement('label')),
		    display = section.appendChild(document.createElement('div')),
		    button = section.appendChild(document.createElement('button')),
		    curLoc = {},
		    locationView = null;

		section.classList.add('question');
		label.innerHTML = questionInfo.label;
		button.innerHTML = questionInfo.button;

		// Add QuestionView-like objects to the list of questions
		questions.ciim_mapLat = {
			getAnswers: function () {
				return {value: curLoc.latitude};
			}
		};
		questions.ciim_mapLat.prototype = Object.create(QuestionView.prototype);
		Events.apply(questions.ciim_mapLat);

		questions.ciim_mapLon = {
			getAnswers: function () {
				return {value: curLoc.longitude};
			}
		};
		questions.ciim_mapLon.prototype = Object.create(QuestionView.prototype);
		Events.apply(questions.ciim_mapLon);

		questions.ciim_mapConfidence = {
			getAnswers: function () {
				return {value: curLoc.confidence};
			}
		};

		locationView = new LocationView({
			callback: function (locationObject) {
				var markup = [],
				    prettyLat = null,
				    prettyLng = null;

				curLoc = locationObject;

				prettyLat = curLoc.latitude;
				if (prettyLat < 0.0) {
					prettyLng = (-1.0*prettyLat).toFixed(curLoc.confidence) + '&deg;S';
				} else {
					prettyLat = prettyLat.toFixed(curLoc.confidence) + '&deg;N';
				}

				prettyLng = curLoc.longitude;
				if (prettyLng < 0.0) {
					prettyLng = (-1.0*prettyLng).toFixed(curLoc.confidence) + '&deg;W';
				} else {
					prettyLng = prettyLng.toFixed(curLoc.confidence) + '&deg;E';
				}

				if (curLoc.place !== null) {
					markup.push(curLoc.place + '<br/>');
				}

				display.innerHTML = '<strong>' +
						((curLoc.place) ? (curLoc.place + '</strong>') : '') +
						prettyLat + ', ' + prettyLng +
						((curLoc.place) ? '' : '</strong>');

				button.classList.add('as-link');
				button.innerHTML = questionInfo.buttonUpdate;

				Events.prototype.trigger.call(questions.ciim_mapLat, 'change');
				Events.prototype.trigger.call(questions.ciim_mapLon, 'change');
			}
		});

		button.addEventListener('click', function () {
			locationView.show({initialLocation: curLoc});
		});

		// Append content to container
		container.appendChild(section);
	};

	/**
	 * Helper method to iterate over a hash of questionInfo creating a view
	 * for each question, appending the views content to the container, and
	 * holding on to a reference to that view on the question hash (keyed by the
	 * same field as in the questionInfo hash).
	 *
	 * @param questionInfo {Object}
	 *      An object of question information keyed by the field name
	 *      corresponding to that information as expected by the DYFI form
	 *      processing code.
	 * @param container {DOMElement} pass-by-reference
	 *      The container into which the view.el should be appended.
	 * @param questions {Object} pass-by-reference
	 *      The resulting hash of {field: QuestionView}
	 */
	var __create_questions = function (questionInfo, container, questions) {
		var field = null,
		    view = null;

		for (field in questionInfo) {
			view = new QuestionView(Util.extend(
					{el: document.createDocumentFragment()}, questionInfo[field]));

			questions[field] = view;
			container.appendChild(view.el);
		}

	};

	var __create_toggle_control = function (info, control) {
		control.innerHTML = info.description;
	};

	var __create_text_questions = function (questionInfo, container, questions) {
		var field = null,
		    view = null;

		for (field in questionInfo) {
			view = __create_text_question_view(questionInfo[field]);

			questions[field] = view;
			container.appendChild(view.el);
		}
	};

	var __create_text_question_view = function (info) {
		var el = document.createElement(info.nodeName || 'section'),
		    label = el.appendChild(document.createElement('label')),
		    input = el.appendChild(document.createElement(info.type || 'input')),
		    id = 'dyfi-text-input-' + (ID_INCREMENT++);

		el.classList.add('dyfi-text-input');
		el.classList.add('question');

		label.innerHTML = info.label;
		label.setAttribute('for', id);

		input.id = id;

		// A lightweight object to mimic the minimally required API for a
		// QuestionView-like object as needed for the DYFIFormPage
		return {
			el: el,
			getAnswers: function () {
				return {value: input.value, label: info.label};
			}
		};
	};

	return DYFIFormPage;
});
