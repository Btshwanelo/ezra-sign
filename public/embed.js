(function() {
  window.EzraSign = window.EzraSign || {};

  class EzraSignEmbed {
    constructor(config) {
      this.config = {
        container: config.container || document.body,
        width: config.width || '90%',
        height: config.height || '90%',
        onCompleted: config.onCompleted || (() => {}),
        onClosed: config.onClosed || (() => {}),
        onError: config.onError || (() => {})
      };
      
      this.modal = null;
      this.iframe = null;
      this.boundHandleMessage = this.handleMessage.bind(this);
      this.boundHandleEscapeKey = this.handleEscapeKey.bind(this);
      this.isInitialized = false;
      this.isClosing = false; // Add flag to prevent callback loops
    }

    async open(signingUrl) {
      try {
        // Clean up any existing modal first
        this.close(false); // Don't trigger onClosed callback when cleaning up

        this.isClosing = false; // Reset closing flag

        // Create modal container
        this.modal = document.createElement('div');
        this.modal.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        `;

        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
          background: white;
          width: ${this.config.width};
          height: ${this.config.height};
          border-radius: 0px;
          position: relative;
          display: flex;
          flex-direction: column;
        `;

        // Create close button
        const closeButton = document.createElement('button');
        closeButton.innerHTML = '&times;';
        closeButton.style.cssText = `
          border: none;
          cursor: pointer;
          padding: 0px;
          width: 1em;
          height: 1em;
          background-color: #aaa;
          border: 0px solid #aaa;
          border-radius: 40px;
          cursor: pointer;
          color: #fff;
          position: absolute;
          top: -10px;
          right: -10px;
          z-index: 1000;
        `;
        closeButton.onclick = () => this.close(true); // User initiated close

        // Create iframe container
        const iframeContainer = document.createElement('div');
        iframeContainer.style.cssText = `
          flex: 1;
          position: relative;
          overflow: hidden;
        `;

        // Create and configure iframe
        this.iframe = document.createElement('iframe');
        this.iframe.style.cssText = `
          width: 100%;
          height: 100%;
          border: none;
        `;

        // Add caching controls to prevent repeated loads
        this.iframe.setAttribute('loading', 'lazy');
        this.iframe.setAttribute('importance', 'high');
        
        // Set iframe source with signing URL
        this.iframe.src = signingUrl;

        // Add elements to DOM
        iframeContainer.appendChild(this.iframe);
        modalContent.appendChild(closeButton);
        modalContent.appendChild(iframeContainer);
        this.modal.appendChild(modalContent);
        this.config.container.appendChild(this.modal);

        // Add event listener for messages from iframe
        window.addEventListener('message', this.boundHandleMessage);

        // Add escape key handler
        document.addEventListener('keydown', this.boundHandleEscapeKey);

        this.isInitialized = true;

      } catch (error) {
        this.config.onError(error);
      }
    }

    handleMessage(event) {
      // Verify origin for security
      // if (!this.isValidOrigin(event.origin)) return;

      const { type, data } = event.data;

      switch (type) {
        case 'SIGNING_COMPLETED':
          this.config.onCompleted(data);
          this.close(true); // User completed signing
          break;
        case 'SIGNING_CLOSED':
          this.close(true); // User closed from inside iframe
          break;
        case 'SIGNING_ERROR':
          this.config.onError(data);
          break;
      }
    }

    handleEscapeKey(event) {
      if (event.key === 'Escape') {
        this.close(true); // User initiated close
      }
    }

    // isValidOrigin(origin) {
    //   const baseUrl = window.ENV?.VITE_API_URL || 'https://ezra360sign-api.mnt.ezra360.com';
    //   const allowedOrigins = [
    //     'http://localhost:3000',
    //     baseUrl,
    //     'https://your-production-domain.com'
    //   ];
    //   return true;
    //   // return allowedOrigins.includes(origin);
    // }

    close(triggerCallback = true) {
      // Prevent multiple close calls
      if (this.isClosing) return;
      this.isClosing = true;

      if (this.modal && this.modal.parentNode) {
        this.modal.parentNode.removeChild(this.modal);
      }
      
      // Remove event listeners
      window.removeEventListener('message', this.boundHandleMessage);
      document.removeEventListener('keydown', this.boundHandleEscapeKey);
      
      // Clear references
      this.modal = null;
      this.iframe = null;
      this.isInitialized = false;
      
      // Only trigger callback if it's a user-initiated close or completion
      if (triggerCallback) {
        this.config.onClosed();
      }
    }
  }

  // Expose the embed class
  window.EzraSign.Embed = EzraSignEmbed;
})();