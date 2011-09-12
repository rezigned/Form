require(function($){

    /**
     * Validator module
     * 
     */
    var Validator = {
        RULES: {
            email: {
                rule: /^[a-z0-9._%-]+@[a-z0-9.-]+\.[a-z]{2,4}$/i,
                msg: 'Invalid email address'
            },
            url: {
                rule: /^(http|https|ftp)\:\/\/[a-z0-9\-\.]+\.[a-z]{2,3}(:[a-z0-9]*)?\/?([a-z0-9\-\._\?\,\'\/\\\+&amp;%\$#\=~])*$/i,
                msg: 'Invalid url'
            },
            match: {
                rule: function(v, selector){
                    var target_v = $(selector).val();

                    return v != target_v;
                },
                msg: "Did not match"
            },
            required: {
                rule: function(v) {
                    return v instanceof Array ? v.length < 1 : $.trim(v) === '';
                },
                msg: 'Is required'
            },
            /* numeric */
            min: {
                rule: function(v, num) {
                    return v.length < num
                },
                msg: 'atleast $0 character'
            },
            max: {
                rule: function(v, num) {
                    return v.length > num
                },
                msg: 'maximum $0 character'
            },
            range: {
                rule: function(v, options) {
                    return v < options.min || v > options.max;
                },
                msg: 'value must between $0 and $1'
            },
            min_length: {
                rule: function(v, options) {

                }
            },
            max_length: {
                rule: function(v, options) {

                }
            },
            /* characters */
            length: {
                rule: function(v, options) {


                }
            },
            password: {
                rule: function(v, options) {

                    if (!/\d+/.test(v))
                        return 'at least one number';
                }
            }
        },
        FILTERS: {
            trim: function(v) {
                return v && v.replace(/^\s+|\s+$/g, '');
            },
            striptags: function(v) {
                return v && v.replace(/<[^>]+>/g, '');
            }
        },

        /**
         * @param string rule   rule name e.g. 'email', 'match', 'required'
         * @param mixed  v      value
         * @param object el     dom element
         * @param mixed  args   callback or rule configs
         */
        validate: function(rule, v, el, args) {

            var errors = [],
                fail   = false,
                msg    = null,
                RULES  = this.RULES;

            // user use custom validation per element
            if (args && args.constructor == Function) {
                msg = fail = args.call(el, v);
            }

            // use normal validation 
            else if (rule in RULES) {
                var r = RULES[rule],
                    c = r.rule.constructor;

                switch(c) {

                    // regex rule
                    case RegExp:

                        fail = !r.rule.test(v);
                        msg  = r.msg;
                        break;

                    // callback rule
                    case Function:

                        var params = [v];
                        params.push(args);

                        var fail = r.rule.apply(null, params);

                        msg = !r.msg ? fail : r.msg;

                        break;
                }
            }

            if (args && msg) {

                msg = msg.replace('$0', args);
                // index 1 becuase of 0 is the value
                //for(var i=0, l=args.length; i<l; i++)
                //   msg = msg.replace('$' + i, args[i])    
            }

            // failed test
            if (fail)
                errors.push(msg);

            return errors;  
        },
        bind: function(fn, ctx) {

            return function(){
                return fn.call(ctx);
            }
        },
        focus: function(e) {
            $('html').animate({
                scrollTop: $(e).offset().top
            });
        }
    };
    
    /**
     * 
     * new Form($('#form'), {
     *     firstname: { 
     *         rules: ['required']
     *     }
     * });
     */
    function Form(form, elements, options) {

        // could use .apply here but i think it's not necessary
        this.construct(form, elements, options);
    }
    
    Form.options = {

        'namespace': 'js-form',

        /**
         * Inline error's position
         * 
         * possible values
         *   'absolute': 
         *   'relative': 
         */
        'inline_style': 'relative',

        /**
         * This only work when 'inline_style' set to 'absolute'
         * 
         * s - South, w - West, n - North, e - East, 
         * sw - South West, se - South East, nw - North West, ne - North East
         */
        'inline_position': 'e',

        /**
         * css class name for inline element
         */
        'inline_css_validated': 'validated',
        'inline_css_failed': 'failed',
        'inline_css_passed': 'passed',
        'inline_css': 'inline-error',

        'inline_html': '<span class="$0"></span>',

        /**
         * Display inline error message
         */ 
        'display_inline': true,
        'gap': 20,

        render_error: function() {

        },

        render_inline_error: function(el, status, msg, parent) {

            var p = $(this.inline_style == 'relative' ? parent : document.body),
                opts   = this,
                el_id  = this.inline_css + '-' + el.attr('name').replace(/[^\w-_]+/, ''),
                notice = $('#' + el_id);

            // check existance
            if (!notice.length)
                notice = $(this.inline_html.replace('$0', this.inline_css));

            notice.attr('id', el_id);

            if (opts.inline_style == 'relative') {
                opts.render_inline_relative(notice, el, p);
            }

            // absolute
            else {
                opts.render_inline_absolute(notice, el, p);
            }

            // show error message
            notice.text(
                this.render_inline_msg(msg)
            );

            p.removeClass(opts.inline_css_passed)
             .removeClass(opts.inline_css_failed)
             .addClass(
                status == 'pass' ? opts.inline_css_passed
                                 : opts.inline_css_failed
            );

            notice.attr('class', opts.inline_css)
                  .show();
        },
        render_inline_msg: function(msg) {
            return msg && msg.join(', ');
        },
        render_inline_relative: function(notice, el, parent) {

            parent.append(notice);
        },
        render_inline_absolute: function(notice, el, parent) {

            var offset = $(el).offset();

            notice.css({
                      'position': 'absolute',
                      left: $(el).outerWidth() + offset.left + this.gap,
                      top: offset.top // ($(el).outerHeight() - notice.height())/2
                  });

            $('body').append(notice);
        }
    }

    Form.prototype = {
        id: null,
        el: null,
        options: {},
        loaded: [], // loaded elements
        validator: null,
        construct: function(form, elements, options) {

            var loaded = [],
                _self  = Validator;

            this.el = form = $(form);
            this[0] = this.el[0];
            this.id = 'form-' + new Date().valueOf() % 99999;

            // no element found ignore
            if (!form.length)
                return;

            this.options = options && $.extend(Form.options, options) 
                                   || Form.options;

            this.el.data('validator', this);
            
            form.addClass(this.options.namespace);

            // handle inline validation
            for(var i in elements) {
                loaded.push(
                    form[0].elements[i] && new Element(form[0].elements[i], elements[i])
                );
            }

            this.loaded    = loaded;
            this.validator = _self;

            // handle form submission
            form.submit(_self.bind(this.validate, this));
        },
        validate: function() {

            var e,
                ls = this.loaded;

            for(var i=0, l=ls.length; i<l; i++) {
                var el = ls[i];

                // invalid
                !el.validate() && !e 
                               && (e = el.el);
            }

            // errors found
            if (e) {
                this.validator.focus(e)
                return false;
            }

            else
                return true;
        }
    };

    /**
     *
     * @example 
     * new Element(input, {
     *     rules: {
     *         required: true,
     *         match: '#other'
     *     },
     *     
     * });
     */
    function Element(el, options) {

        this.construct(el, options);
    }
        
    Element.prototype = {
        parent: null, // element's container - to add inline status
        rules: {},
        filters: {},
        validator: null,
        _item: null,
        options: {
            rules: {},
            filters: {}
        },

        /**
         * @param native el      native dom element
         * @param object options element's options
         */
        construct: function(el, options, validator) {

            this[0] = el;
            this.el = $(el);

            this.validator = options.validator || Validator;
            this.renderer  = $(this.item().form).data('validator').options;

            this.parent = this._parent(this.el, options.parent);
            this.rules  = this._rules(options.rules);

            // add on blur event
            this.blur();
        },
        /**
         * Always return single element
         */
        item: function() {

            if (!this._item) {
                var e = this[0];

                this._item = e.length // && !!(e.nodeName && e.nodeName.toLowerCase() != 'select')
                             ? e[e.length - 1] 
                             : e;
            }

            return this._item;
        },
        value: function() {

            var e    = this[0],
                vals = [],
                els;

            if (e.type != 'select-one') {

                // options
                if (e.type == 'select-multiple')
                    els = $(e).find(':selected');

                // radios, checkboxes
                else if (e.length || e.type == 'checkbox')
                    els = $(e).filter(':checked');
            }

            if (els)
                for(var i=0, l=els.length; i<l; i++)
                    els[i].value && vals.push(els[i].value);

            return els ? vals : e.value;

        },

        /**
         * @param array|object rules set
         */
        validate: function() {

            var v  = this.value(),
                vd = this.validator,
                el = this[0],
                results  = [],
                rules    = this.rules;

            // test all rules
            for(var rule in rules) {

                var e;
                if (e = vd.validate(rule, v, el, rules[rule]))
                    e.length && results.push(e);
            }

            // display error/success message
            if (results.length) {
                // console.log(this.renderer.render_inline_error(this.item(), 'fail', results, this.parent) & 1, results, 'err')
                this.renderer.render_inline_error(this.el, 'fail', results, this.parent);
                return false;
            }
            else {
                // console.log(this.renderer.render_inline_error(this.item(), 'pass', '', this.parent) | 1);
                this.renderer.render_inline_error(this.el, 'pass', '', this.parent);
                return true;
            }
        },

        /**
         * Find element's parent node
         */
        _parent: function(el, parent) {

            var p,
                e = el[0]; // native element

            if (parent) {

                switch(parent.constructor) {
                    case Function:
                        p = parent.call(e);
                        break;

                    case String:

                        p = $(e).closest(parent);
                        break;
                }
            }

            else
                // in case of multiple elements e.g. radios we use 2nd parent
                p = el.length > 1 ? e.parentNode.parentNode : e.parentNode;

            return p;
        },

        /**
         * Normalize all rules
         * 
         */
        _rules: function(rules) {

            var r = {required: null};

            // normalize the rules
            if (rules instanceof Array) {

                for(var j=0, l=rules.length; j<l; j++) {
                    r[rules[j]] = false;
                }
            }
            else {

                for(var i in rules)
                    r[i] = rules[i];
            }

            return r;
        },
        blur: function() {

            var _self = this;

            this.el.blur(function(){
                _self.validate();
            });
        }
    };

    // declare modules
    return {
        namespace: 'form',
        construct: function() {
            
            /**
             * Jquery ways
             * 
             * $('#form_id').validator({
             *    input_name_1: {
             *       rules: 
             *    }
             * })
             */
            
            //var $ = require('jquery');
            
            $.fn.validator = function(elements, options) {

                this.each(function(){
                    new Form(this, elements, options);
                });
            };
        },
        Form: Form,
        Element: Element,
        Validator: Validator
    }
    
}(jQuery));