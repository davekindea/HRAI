/**
 * Template Service - Configurable email and message templates
 * Handles template creation, management, personalization, and multi-language support
 */

const moment = require('moment');
const { v4: uuidv4 } = require('uuid');

class TemplateService {
    constructor() {
        this.templates = new Map();
        this.templateVersions = new Map();
        this.templateVariables = new Map();
        this.renderingEngine = this.initializeRenderingEngine();
    }

    /**
     * TEMPLATE MANAGEMENT
     */

    // Create email template
    async createEmailTemplate(data) {
        try {
            const template = {
                id: uuidv4(),
                type: 'email',
                category: data.category, // notification, marketing, transactional, system
                name: data.name,
                description: data.description || '',
                
                // Template content
                subject: data.subject,
                htmlBody: data.htmlBody,
                textBody: data.textBody,
                
                // Variables and personalization
                variables: data.variables || [], // [{name, type, description, required, defaultValue}]
                dynamicContent: data.dynamicContent || [], // [{condition, content}]
                
                // Localization
                languages: {
                    default: data.language || 'en',
                    supported: data.supportedLanguages || ['en'],
                    translations: new Map() // language -> {subject, htmlBody, textBody}
                },
                
                // Design and styling
                design: {
                    theme: data.design?.theme || 'default',
                    customCSS: data.design?.customCSS || '',
                    header: data.design?.header || null,
                    footer: data.design?.footer || null,
                    logo: data.design?.logo || null,
                    colors: {
                        primary: data.design?.colors?.primary || '#007bff',
                        secondary: data.design?.colors?.secondary || '#6c757d',
                        background: data.design?.colors?.background || '#ffffff',
                        text: data.design?.colors?.text || '#333333'
                    }
                },
                
                // Settings
                settings: {
                    trackOpens: data.settings?.trackOpens !== false,
                    trackClicks: data.settings?.trackClicks !== false,
                    allowUnsubscribe: data.settings?.allowUnsubscribe || false,
                    priority: data.settings?.priority || 'normal',
                    sendingDomain: data.settings?.sendingDomain || null
                },
                
                // Validation
                validation: {
                    isValid: false,
                    errors: [],
                    warnings: []
                },
                
                // Version control
                version: 1,
                parentTemplateId: data.parentTemplateId || null,
                
                // Status
                status: 'draft', // draft, active, archived, deprecated
                isDefault: data.isDefault || false,
                
                // Usage tracking
                usage: {
                    sendCount: 0,
                    lastUsed: null,
                    averageOpenRate: 0,
                    averageClickRate: 0
                },
                
                // Metadata
                createdAt: moment().toISOString(),
                createdBy: data.createdBy,
                updatedAt: moment().toISOString(),
                updatedBy: data.createdBy,
                
                // Tags and categorization
                tags: data.tags || [],
                accessLevel: data.accessLevel || 'organization' // user, team, organization, global
            };

            // Validate template
            const validation = await this.validateTemplate(template);
            template.validation = validation;

            // Store template
            this.templates.set(template.id, template);

            return {
                success: true,
                templateId: template.id,
                version: template.version,
                isValid: validation.isValid,
                errors: validation.errors,
                warnings: validation.warnings
            };
        } catch (error) {
            throw new Error(`Failed to create email template: ${error.message}`);
        }
    }

    // Create message template
    async createMessageTemplate(data) {
        try {
            const template = {
                id: uuidv4(),
                type: 'message',
                category: data.category, // internal, notification, alert, reminder
                name: data.name,
                description: data.description || '',
                
                // Template content
                title: data.title || '',
                content: data.content,
                
                // Message type specific
                messageType: data.messageType, // direct, group, broadcast, system
                priority: data.priority || 'normal',
                
                // Variables
                variables: data.variables || [],
                dynamicContent: data.dynamicContent || [],
                
                // Localization
                languages: {
                    default: data.language || 'en',
                    supported: data.supportedLanguages || ['en'],
                    translations: new Map()
                },
                
                // Formatting
                formatting: {
                    allowHTML: data.formatting?.allowHTML || false,
                    allowMarkdown: data.formatting?.allowMarkdown || true,
                    maxLength: data.formatting?.maxLength || 1000,
                    allowEmojis: data.formatting?.allowEmojis !== false
                },
                
                // Actions
                actions: data.actions || [], // [{text, url, type}]
                
                // Settings
                settings: {
                    requireAcknowledgment: data.settings?.requireAcknowledgment || false,
                    expiresAfter: data.settings?.expiresAfter || null, // minutes
                    allowReplies: data.settings?.allowReplies !== false
                },
                
                // Version control
                version: 1,
                parentTemplateId: data.parentTemplateId || null,
                
                // Status
                status: 'draft',
                isDefault: data.isDefault || false,
                
                // Usage tracking
                usage: {
                    sendCount: 0,
                    lastUsed: null,
                    averageResponseTime: 0,
                    responseRate: 0
                },
                
                // Metadata
                createdAt: moment().toISOString(),
                createdBy: data.createdBy,
                updatedAt: moment().toISOString(),
                updatedBy: data.createdBy,
                
                tags: data.tags || [],
                accessLevel: data.accessLevel || 'organization'
            };

            // Validate template
            const validation = await this.validateTemplate(template);
            template.validation = validation;

            this.templates.set(template.id, template);

            return {
                success: true,
                templateId: template.id,
                version: template.version,
                isValid: validation.isValid
            };
        } catch (error) {
            throw new Error(`Failed to create message template: ${error.message}`);
        }
    }

    // Update template
    async updateTemplate(templateId, updates, userId) {
        try {
            const template = this.templates.get(templateId);
            if (!template) {
                throw new Error('Template not found');
            }

            if (!this.canUserEditTemplate(userId, template)) {
                throw new Error('Insufficient permissions to edit template');
            }

            // Create new version if template is active
            if (template.status === 'active' && updates.createNewVersion !== false) {
                return await this.createTemplateVersion(templateId, updates, userId);
            }

            // Apply updates
            const updatedTemplate = {
                ...template,
                ...updates,
                updatedAt: moment().toISOString(),
                updatedBy: userId
            };

            // Re-validate template
            const validation = await this.validateTemplate(updatedTemplate);
            updatedTemplate.validation = validation;

            this.templates.set(templateId, updatedTemplate);

            return {
                success: true,
                templateId,
                version: updatedTemplate.version,
                isValid: validation.isValid,
                errors: validation.errors
            };
        } catch (error) {
            throw new Error(`Failed to update template: ${error.message}`);
        }
    }

    /**
     * TEMPLATE RENDERING
     */

    // Render email template
    async renderEmailTemplate(templateId, variables = {}, options = {}) {
        try {
            const template = this.templates.get(templateId);
            if (!template || template.type !== 'email') {
                throw new Error('Email template not found');
            }

            if (template.status !== 'active') {
                throw new Error('Template is not active');
            }

            const {
                language = template.languages.default,
                previewMode = false,
                recipientData = {}
            } = options;

            // Get localized content
            const content = await this.getLocalizedContent(template, language);

            // Merge variables with defaults
            const mergedVariables = this.mergeVariables(template, variables, recipientData);

            // Render subject
            const renderedSubject = await this.renderContent(content.subject, mergedVariables);

            // Render HTML body
            const renderedHtmlBody = await this.renderContent(content.htmlBody, mergedVariables);

            // Render text body
            const renderedTextBody = await this.renderContent(content.textBody, mergedVariables);

            // Apply design and styling
            const styledHtmlBody = await this.applyDesign(renderedHtmlBody, template.design);

            // Add tracking if not preview mode
            const finalHtmlBody = previewMode ? 
                styledHtmlBody : 
                await this.addTracking(styledHtmlBody, template.settings);

            // Update usage stats
            if (!previewMode) {
                await this.updateTemplateUsage(templateId);
            }

            return {
                success: true,
                templateId,
                rendered: {
                    subject: renderedSubject,
                    htmlBody: finalHtmlBody,
                    textBody: renderedTextBody,
                    fromEmail: template.settings.sendingDomain || process.env.DEFAULT_FROM_EMAIL,
                    replyTo: template.settings.replyTo || null
                },
                variables: mergedVariables,
                metadata: {
                    templateName: template.name,
                    version: template.version,
                    language,
                    renderTime: moment().toISOString()
                }
            };
        } catch (error) {
            throw new Error(`Failed to render email template: ${error.message}`);
        }
    }

    // Render message template
    async renderMessageTemplate(templateId, variables = {}, options = {}) {
        try {
            const template = this.templates.get(templateId);
            if (!template || template.type !== 'message') {
                throw new Error('Message template not found');
            }

            const {
                language = template.languages.default,
                recipientData = {}
            } = options;

            // Get localized content
            const content = await this.getLocalizedContent(template, language);

            // Merge variables
            const mergedVariables = this.mergeVariables(template, variables, recipientData);

            // Render title
            const renderedTitle = await this.renderContent(content.title || '', mergedVariables);

            // Render content
            const renderedContent = await this.renderContent(content.content, mergedVariables);

            // Apply formatting
            const formattedContent = await this.applyFormatting(renderedContent, template.formatting);

            // Render actions
            const renderedActions = await this.renderActions(template.actions, mergedVariables);

            // Update usage stats
            await this.updateTemplateUsage(templateId);

            return {
                success: true,
                templateId,
                rendered: {
                    title: renderedTitle,
                    content: formattedContent,
                    actions: renderedActions,
                    priority: template.priority,
                    messageType: template.messageType
                },
                variables: mergedVariables,
                settings: template.settings
            };
        } catch (error) {
            throw new Error(`Failed to render message template: ${error.message}`);
        }
    }

    /**
     * TEMPLATE VERSIONING
     */

    // Create template version
    async createTemplateVersion(templateId, updates, userId) {
        try {
            const originalTemplate = this.templates.get(templateId);
            if (!originalTemplate) {
                throw new Error('Original template not found');
            }

            const newVersion = {
                ...originalTemplate,
                ...updates,
                id: uuidv4(),
                version: originalTemplate.version + 1,
                parentTemplateId: templateId,
                status: 'draft',
                createdAt: moment().toISOString(),
                createdBy: userId,
                updatedAt: moment().toISOString(),
                updatedBy: userId
            };

            // Validate new version
            const validation = await this.validateTemplate(newVersion);
            newVersion.validation = validation;

            this.templates.set(newVersion.id, newVersion);

            // Store version reference
            if (!this.templateVersions.has(templateId)) {
                this.templateVersions.set(templateId, []);
            }
            this.templateVersions.get(templateId).push(newVersion.id);

            return {
                success: true,
                templateId: newVersion.id,
                version: newVersion.version,
                parentTemplateId: templateId,
                isValid: validation.isValid
            };
        } catch (error) {
            throw new Error(`Failed to create template version: ${error.message}`);
        }
    }

    // Get template versions
    async getTemplateVersions(templateId) {
        try {
            const versions = [];
            const versionIds = this.templateVersions.get(templateId) || [];

            for (const versionId of versionIds) {
                const template = this.templates.get(versionId);
                if (template) {
                    versions.push({
                        id: template.id,
                        version: template.version,
                        status: template.status,
                        createdAt: template.createdAt,
                        createdBy: template.createdBy,
                        isActive: template.status === 'active'
                    });
                }
            }

            // Sort by version number
            versions.sort((a, b) => b.version - a.version);

            return {
                success: true,
                templateId,
                versions
            };
        } catch (error) {
            throw new Error(`Failed to get template versions: ${error.message}`);
        }
    }

    /**
     * TEMPLATE LOCALIZATION
     */

    // Add translation
    async addTranslation(templateId, language, translation, userId) {
        try {
            const template = this.templates.get(templateId);
            if (!template) {
                throw new Error('Template not found');
            }

            if (!this.canUserEditTemplate(userId, template)) {
                throw new Error('Insufficient permissions to edit template');
            }

            // Validate translation content
            const validation = await this.validateTranslation(template, language, translation);
            if (!validation.isValid) {
                return {
                    success: false,
                    errors: validation.errors
                };
            }

            // Add translation
            template.languages.translations.set(language, {
                ...translation,
                translatedBy: userId,
                translatedAt: moment().toISOString()
            });

            // Add to supported languages if not already there
            if (!template.languages.supported.includes(language)) {
                template.languages.supported.push(language);
            }

            template.updatedAt = moment().toISOString();
            template.updatedBy = userId;

            return {
                success: true,
                templateId,
                language,
                supportedLanguages: template.languages.supported
            };
        } catch (error) {
            throw new Error(`Failed to add translation: ${error.message}`);
        }
    }

    /**
     * TEMPLATE VARIABLES AND DYNAMIC CONTENT
     */

    // Define template variable
    async defineTemplateVariable(data) {
        try {
            const variable = {
                id: uuidv4(),
                name: data.name,
                type: data.type, // string, number, boolean, date, object, array
                description: data.description || '',
                required: data.required || false,
                defaultValue: data.defaultValue || null,
                
                // Validation
                validation: {
                    pattern: data.validation?.pattern || null,
                    minLength: data.validation?.minLength || null,
                    maxLength: data.validation?.maxLength || null,
                    min: data.validation?.min || null,
                    max: data.validation?.max || null,
                    options: data.validation?.options || null // for enum types
                },
                
                // Format options
                format: {
                    dateFormat: data.format?.dateFormat || 'YYYY-MM-DD',
                    numberFormat: data.format?.numberFormat || null,
                    currency: data.format?.currency || null
                },
                
                // Categories
                category: data.category || 'general', // user, system, content, contact
                tags: data.tags || [],
                
                createdAt: moment().toISOString(),
                createdBy: data.createdBy
            };

            this.templateVariables.set(variable.id, variable);

            return {
                success: true,
                variableId: variable.id,
                name: variable.name,
                type: variable.type
            };
        } catch (error) {
            throw new Error(`Failed to define template variable: ${error.message}`);
        }
    }

    // Get available variables
    async getAvailableVariables(category = null) {
        try {
            let variables = Array.from(this.templateVariables.values());

            if (category) {
                variables = variables.filter(v => v.category === category);
            }

            return {
                success: true,
                variables: variables.map(v => ({
                    id: v.id,
                    name: v.name,
                    type: v.type,
                    description: v.description,
                    required: v.required,
                    defaultValue: v.defaultValue,
                    category: v.category
                }))
            };
        } catch (error) {
            throw new Error(`Failed to get available variables: ${error.message}`);
        }
    }

    /**
     * TEMPLATE ANALYTICS
     */

    // Get template analytics
    async getTemplateAnalytics(templateId, period = 'month') {
        try {
            const template = this.templates.get(templateId);
            if (!template) {
                throw new Error('Template not found');
            }

            const analytics = {
                templateId,
                templateName: template.name,
                period,
                
                // Usage statistics
                usage: {
                    totalSends: template.usage.sendCount,
                    averageOpenRate: template.usage.averageOpenRate,
                    averageClickRate: template.usage.averageClickRate,
                    lastUsed: template.usage.lastUsed
                },
                
                // Performance metrics
                performance: {
                    renderTime: 0, // Average render time
                    errorRate: 0, // Percentage of failed renders
                    variableCompletionRate: 0 // Percentage of variables successfully filled
                },
                
                // Trends
                trends: {
                    daily: {},
                    weekly: {},
                    monthly: {}
                },
                
                // A/B testing results
                abTestResults: [],
                
                generatedAt: moment().toISOString()
            };

            return {
                success: true,
                analytics
            };
        } catch (error) {
            throw new Error(`Failed to get template analytics: ${error.message}`);
        }
    }

    /**
     * UTILITY METHODS
     */

    // Initialize rendering engine
    initializeRenderingEngine() {
        // Template rendering engine setup would go here
        // Could use Handlebars, Mustache, or custom engine
        return {
            render: (content, variables) => {
                // Simple variable replacement for demonstration
                let rendered = content;
                for (const [key, value] of Object.entries(variables)) {
                    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
                    rendered = rendered.replace(regex, value || '');
                }
                return rendered;
            }
        };
    }

    // Validate template
    async validateTemplate(template) {
        try {
            const errors = [];
            const warnings = [];

            // Basic validation
            if (!template.name || template.name.trim() === '') {
                errors.push('Template name is required');
            }

            if (template.type === 'email') {
                if (!template.subject || template.subject.trim() === '') {
                    errors.push('Email subject is required');
                }
                if (!template.htmlBody && !template.textBody) {
                    errors.push('Either HTML body or text body is required');
                }
            } else if (template.type === 'message') {
                if (!template.content || template.content.trim() === '') {
                    errors.push('Message content is required');
                }
            }

            // Variable validation
            for (const variable of template.variables) {
                if (!variable.name || !variable.type) {
                    errors.push(`Invalid variable definition: ${JSON.stringify(variable)}`);
                }
            }

            return {
                isValid: errors.length === 0,
                errors,
                warnings
            };
        } catch (error) {
            return {
                isValid: false,
                errors: [`Validation error: ${error.message}`],
                warnings: []
            };
        }
    }

    // Validate translation
    async validateTranslation(template, language, translation) {
        try {
            const errors = [];

            if (template.type === 'email') {
                if (!translation.subject) {
                    errors.push('Translated subject is required');
                }
                if (!translation.htmlBody && !translation.textBody) {
                    errors.push('Either translated HTML body or text body is required');
                }
            } else if (template.type === 'message') {
                if (!translation.content) {
                    errors.push('Translated content is required');
                }
            }

            return {
                isValid: errors.length === 0,
                errors
            };
        } catch (error) {
            return {
                isValid: false,
                errors: [`Translation validation error: ${error.message}`]
            };
        }
    }

    // Get localized content
    async getLocalizedContent(template, language) {
        try {
            const translation = template.languages.translations.get(language);
            
            if (translation) {
                return translation;
            }
            
            // Fallback to default language
            return {
                subject: template.subject,
                htmlBody: template.htmlBody,
                textBody: template.textBody,
                content: template.content,
                title: template.title
            };
        } catch (error) {
            throw new Error(`Failed to get localized content: ${error.message}`);
        }
    }

    // Merge variables with defaults
    mergeVariables(template, variables, recipientData) {
        const merged = { ...variables, ...recipientData };
        
        // Add default values for missing variables
        for (const varDef of template.variables) {
            if (!(varDef.name in merged) && varDef.defaultValue !== null) {
                merged[varDef.name] = varDef.defaultValue;
            }
        }
        
        // Add system variables
        merged._system = {
            currentDate: moment().format('YYYY-MM-DD'),
            currentTime: moment().format('HH:mm:ss'),
            currentYear: moment().year(),
            templateName: template.name,
            templateVersion: template.version
        };
        
        return merged;
    }

    // Render content with variables
    async renderContent(content, variables) {
        try {
            return this.renderingEngine.render(content, variables);
        } catch (error) {
            throw new Error(`Failed to render content: ${error.message}`);
        }
    }

    // Apply design to HTML
    async applyDesign(htmlContent, design) {
        try {
            // Design application logic would go here
            // This would wrap content in HTML structure, apply CSS, etc.
            return htmlContent;
        } catch (error) {
            throw new Error(`Failed to apply design: ${error.message}`);
        }
    }

    // Add tracking to email
    async addTracking(htmlContent, settings) {
        try {
            let trackedContent = htmlContent;
            
            if (settings.trackOpens) {
                // Add open tracking pixel
                trackedContent += '<img src="{{tracking_pixel_url}}" width="1" height="1" border="0" style="display:none;" />';
            }
            
            if (settings.trackClicks) {
                // Wrap links with tracking
                trackedContent = trackedContent.replace(
                    /<a\s+href="([^"]+)"([^>]*)>/g,
                    '<a href="{{track_click_url}}?url=$1"$2>'
                );
            }
            
            return trackedContent;
        } catch (error) {
            throw new Error(`Failed to add tracking: ${error.message}`);
        }
    }

    // Apply formatting to message content
    async applyFormatting(content, formatting) {
        try {
            let formatted = content;
            
            if (formatting.allowMarkdown) {
                // Convert markdown to appropriate format
                // formatted = markdownToHtml(formatted);
            }
            
            if (!formatting.allowHTML) {
                // Strip HTML tags
                formatted = formatted.replace(/<[^>]*>/g, '');
            }
            
            if (formatting.maxLength && formatted.length > formatting.maxLength) {
                formatted = formatted.substring(0, formatting.maxLength) + '...';
            }
            
            return formatted;
        } catch (error) {
            throw new Error(`Failed to apply formatting: ${error.message}`);
        }
    }

    // Render actions
    async renderActions(actions, variables) {
        try {
            const renderedActions = [];
            
            for (const action of actions) {
                renderedActions.push({
                    text: await this.renderContent(action.text, variables),
                    url: await this.renderContent(action.url, variables),
                    type: action.type
                });
            }
            
            return renderedActions;
        } catch (error) {
            throw new Error(`Failed to render actions: ${error.message}`);
        }
    }

    // Check if user can edit template
    canUserEditTemplate(userId, template) {
        // Permission checking logic would go here
        return true; // Simplified for now
    }

    // Update template usage statistics
    async updateTemplateUsage(templateId) {
        try {
            const template = this.templates.get(templateId);
            if (template) {
                template.usage.sendCount += 1;
                template.usage.lastUsed = moment().toISOString();
            }
        } catch (error) {
            console.error(`Failed to update template usage: ${error.message}`);
        }
    }
}

module.exports = new TemplateService();
