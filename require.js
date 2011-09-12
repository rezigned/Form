(function(ctx) {
    
    var exports = ctx.exports || {},
        NS_SEPARATOR = '.';
    
    function load_resource() {
        
    }
    
    // require module
    ctx['require'] = function() {
        
        var fn = arguments[0],
            loaded = {};

        switch(fn.constructor) {
            
            // declare modules
            case Function:
            case Object:
                
                var m = fn == Function ? new fn : fn;
                
                m.construct && m.construct.call(m);
                exports[m.namespace] = m;

                break;
                
            // import module
            case String:
                
                // check cache
                if (loaded[fn])
                    return loaded[fn];
                
                // check submodule
                var mods;
                if (~fn.indexOf(NS_SEPARATOR))
                    mods = fn.split(NS_SEPARATOR);

                var m;
                
                if (mods) {
                    var t = exports[mods.shift()],
                        c = 0;
                    
                    // recursive finding
                    for(var i=0, l=mods.length; i<l; i++)
                        ++c && (t = t[mods[i]]);
                    
                    // modules match with iterations 
                    if (c == i)
                        m = t;
                }
                
                else {
                     m = exports[fn];
                }

                // load resource
                //if (m)
                //  throw new Error("Can't find module {" + fn  + "}");
                
                loaded[fn] = m;
                
                return m;
                break;
                
            case Array:
                
                break;
        }
    }
    
    ctx.exports = exports;
    
})(this);