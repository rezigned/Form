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
    Form: function(form, elements, options) {

        var loaded = [],
            _self  = this;

        form = $(form);

        form.addClass('js-form');
        
        // no element found ignore
        if (!form.length)
            return;
        
        // handle onblur (inline validation)
        for(var i in elements) {
            loaded.push(
                form[0].elements[i] && new this.Element(form[0].elements[i], elements[i])
            );
        }

        // handle form submission
        form.submit(function(){
            
            var e;
            
            for(var i=0, l=loaded.length; i<l; i++) {
                var el = loaded[i];
                
                // invalid
                if (!el.validate())
                    !e && (e = el.el);
            }
                

            // errors found
            if (e) {

                _self.focus(e);
                return false;
            } 
            else
                return true;
        });

    },
    display_status: function() {
        
    },
    display_inline_status: function(el, status, msg, parent) {

        var li = $(parent);

        var css_status = 'validated',
            css_error  = 'failed',
            css_pass   = 'passed',
            tpl = '<div class="inline-error"></div>',
            gap = 10,
            offset = $(el).offset(),
            li_offset = li.offset();
            
        // li.css('position') == 'static' ? {top: 0, left: 0} : 
        var notice = li.addClass(css_status)
                       .find('.inline-error');

        if (!notice.length)
            notice = $(tpl).appendTo(li);

        // show error message
        notice.text(msg);

        notice.removeClass(css_error)
          .css({
              left: (offset.left + $(el).outerWidth()) - li_offset.left + gap,
              top: offset.top - li_offset.top + (($(el).outerHeight() - notice.height())/2)
          })
          .removeClass(css_pass)
          .addClass(
              status == 'pass' ? css_pass 
                               : css_error
          ).show();
    },
    focus: function(e) {
        $('html').animate({
            scrollTop: $(e).offset().top
        });
    },
    
    Element: function(el, options) {
        this.construct(el, options);
    }
};

Validator.Form.prototype = {
    options: {
        
        /**
         * Inline error's position
         * 
         * possible values
         *   'absolute': 
         *   'relative': 
         */
        'inline_style': 'absolute',
        
        /**
         * This only work with 'inline_style': 'absolute'
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
        
        'inline_html': '',
        
        /**
         * Display inline error message
         */ 
        'display_inline': true
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
Validator.Element.prototype = {
    parent: null, // element's container - to add inline status
    validator: null,
    rules: {},
    filters: {},
    options: {
        rules: {},
        filters: {}
    },
    construct: function(el, options, validator) {

        this.el = $(el);
        this[0] = this.el[0];
        this.validator = options.validator || Validator;
        this.parent = this._parent(this.item(), options.parent);
        this.rules  = this._rules(options.rules);

        // add on blur event
        this.blur();
    },
    /**
     * Always return single element
     */
    item: function() {
        return this[0].length && this[0].type != 'select-one' ? this[0][this[0].length - 1] : this[0];
    },
    value: function() {
        
        var e = this[0];
        
        // selects, radios, checkboxes
        if (e.length && e.type != 'select-one') {
            
            var vals = [];
            $(e).filter(':checked').each(function(){
                vals.push(this.value);
            });

            return vals;
        }

        return e.value;
        
    },

    /**
     * @param array|object rules set
     */
    validate: function() {

        var v  = this.value(),
            el = this[0],
            results = [],
            rules   = this.rules;

        // test all rules
        for(var rule in rules) {

            var e;
            if (e = this._validate(rule, el, v, rules[rule]))
                e.length && results.push(e);
        }
        
        // display error/success message
        if (results.length) {
            this.validator.display_inline_status(this.item(), 'fail', results.join(', '), this.parent);

            return false;
        }
        else {
            this.validator.display_inline_status(this.item(), 'pass', '', this.parent);

            return true;
        }
    },
    
    /**
     * Find element's parent node
     */
    _parent: function(el, parent) {
        
        var li;

        if (parent) {

            switch(parent.constructor) {
                case Function:
                    li = parent.call(el);
                    break;

                case String:

                    li = $(el).closest(parent);
                    break;
            }
        }
        
        else
            li = el.parentNode;
        
        return li;
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

    /**
     * @param string rule name e.g. 'email', 'match'
     * @param mixed  value
     * @param mixed  arguments to callback function or the callback it self
     */
    _validate: function(r, el, v, args) {

        var errors = [],
            fail   = false,
            msg    = null,
            RULES  = this.validator.RULES;

        // user use custom validation per element
        if (args && args.constructor == Function) {
            msg = fail = args.call(el, v);
        }

        // use normal validation 
        else if (r in RULES) {
            var rule = RULES[r],
                c    = rule.rule.constructor;

            switch(c) {

                // regex rule
                case RegExp:

                    fail = !rule.rule.test(v);
                    msg  = rule.msg;
                    break;

                // callback rule
                case Function:

                    var params = [v];
                    params.push(args);

                    var fail = rule.rule.apply(null, params);

                    msg = !rule.msg ? fail : rule.msg;
                    
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
    filter: function() {

    },
    blur: function() {

        var _self = this;

        this.el.blur(function(){
            _self.validate();
        });
    }
};

/**
 * Jquery ways
 * 
 * $('#form_id').validator({
 *    input_name_1: {
 *       rules: 
 *    }
 * })
 */

(function($){
    
    $.fn.validator = function(elements, options) {
        
        this.each(function(){
            Validator.Form(this, elements, options);
        });
    }
    
})(jQuery)
