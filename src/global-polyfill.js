// This file provides polyfills for Node.js globals in the browser environment

if (typeof window !== 'undefined') {
  // Polyfill for Node.js 'global' object
  window.global = window;
  
  // Polyfill for Node.js 'process' object
  if (typeof window.process === 'undefined') {
    window.process = {
      env: {},
      nextTick: function(cb) {
        setTimeout(cb, 0);
      }
    };
  }
  
  // Polyfill for Node.js 'Buffer' object
  if (typeof window.Buffer === 'undefined') {
    window.Buffer = {
      isBuffer: function() { return false; }
    };
  }
  
  // Polyfill for Node.js 'events' module
  if (typeof window.events === 'undefined') {
    window.events = {
      EventEmitter: function() {
        this.listeners = {};
        
        this.on = function(event, listener) {
          if (!this.listeners[event]) {
            this.listeners[event] = [];
          }
          this.listeners[event].push(listener);
          return this;
        };
        
        this.emit = function(event, ...args) {
          if (this.listeners[event]) {
            this.listeners[event].forEach(listener => listener(...args));
          }
          return !!this.listeners[event];
        };
        
        this.removeListener = function(event, listener) {
          if (this.listeners[event]) {
            this.listeners[event] = this.listeners[event].filter(l => l !== listener);
          }
          return this;
        };
      }
    };
  }
  
  // Polyfill for Node.js 'util' module
  if (typeof window.util === 'undefined') {
    window.util = {
      debuglog: function() {
        return function() {}; // No-op function
      },
      inspect: function(obj) {
        return JSON.stringify(obj);
      }
    };
  }
}