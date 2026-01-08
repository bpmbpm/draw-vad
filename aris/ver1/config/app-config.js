/**
 * ARIS Express Clone - Application Configuration
 *
 * This configuration file controls the application settings and behavior.
 * Settings can be modified to customize the interface and functionality.
 */

const AppConfig = {
    // Application metadata
    app: {
        name: 'ARIS Express Clone',
        version: '1.1.0',
        author: 'draw-vad',
        description: 'Business process modeling tool supporting VAD, EPC, and organizational diagrams',
        lastUpdate: {
            issueNumber: 17,
            issueTitle: 'Aris1e',
            prNumber: 18,
            prTitle: 'Metamodel markdown export, issue indicator, connector fixes, diagram naming'
        }
    },

    // UI settings
    ui: {
        // Language (ru - русский, en - English)
        language: 'ru',

        // Theme (light, dark)
        theme: 'light',

        // Grid settings
        grid: {
            enabled: true,
            size: 20,
            color: '#e0e0e0',
            snapToGrid: true
        },

        // Canvas settings
        canvas: {
            backgroundColor: '#ffffff',
            defaultZoom: 100,
            minZoom: 25,
            maxZoom: 400
        },

        // Panel visibility
        panels: {
            explorer: true,
            stencils: true,
            properties: true,
            toolbar: true
        },

        // Default panel sizes (in pixels)
        panelSizes: {
            leftPanel: 250,
            rightPanel: 280
        }
    },

    // Notation settings
    notations: {
        // Default notation when creating new diagram
        default: 'vad',

        // VAD (Value Added Diagram) configuration
        vad: {
            enabled: true,
            name: 'VAD - Value Added Diagram',
            description: 'Диаграмма добавленной стоимости',

            // Shape types and their properties
            shapes: {
                baseProcess: {
                    type: 'baseVAD',
                    shape: 'mxgraph.arrows2.arrow',
                    fillColor: '#B9E0A5',
                    strokeColor: '#82b366',
                    defaultWidth: 100,
                    defaultHeight: 60
                },
                detailProcess: {
                    type: 'detailVAD',
                    shape: 'mxgraph.arrows2.arrow',
                    fillColor: '#B9E0A6',
                    strokeColor: '#82b366',
                    defaultWidth: 100,
                    defaultHeight: 60
                },
                externalProcess: {
                    type: 'externVAD',
                    shape: 'mxgraph.arrows2.arrow',
                    fillColor: '#D4E1F5',
                    strokeColor: '#6c8ebf',
                    defaultWidth: 100,
                    defaultHeight: 60
                },
                note: {
                    type: 'note',
                    shape: 'note',
                    fillColor: '#fff2cc',
                    strokeColor: '#d6b656',
                    defaultWidth: 680,
                    defaultHeight: 100
                }
            },

            // Connection types
            connections: {
                sequence: {
                    type: 'hasNext',
                    style: 'endArrow=classic',
                    strokeColor: '#000000'
                }
            },

            // Text styles
            textStyles: {
                role: {
                    fontColor: '#1A1A1A'
                },
                comment: {
                    fontColor: '#FF6666'
                },
                processTitle: {
                    fontColor: '#333333'
                }
            }
        },

        // EPC (Event-driven Process Chain) configuration
        epc: {
            enabled: true,
            name: 'EPC - Event-driven Process Chain',
            description: 'Событийная цепочка процессов',

            shapes: {
                event: {
                    type: 'event',
                    shape: 'hexagon',
                    fillColor: '#ffe6cc',
                    strokeColor: '#d79b00',
                    defaultWidth: 120,
                    defaultHeight: 60
                },
                function: {
                    type: 'function',
                    shape: 'rectangle',
                    fillColor: '#d5e8d4',
                    strokeColor: '#82b366',
                    defaultWidth: 120,
                    defaultHeight: 60
                },
                connector: {
                    type: 'connector',
                    shape: 'rhombus',
                    fillColor: '#fff2cc',
                    strokeColor: '#d6b656',
                    defaultWidth: 40,
                    defaultHeight: 40
                },
                organizationalUnit: {
                    type: 'orgUnit',
                    shape: 'ellipse',
                    fillColor: '#e1d5e7',
                    strokeColor: '#9673a6',
                    defaultWidth: 100,
                    defaultHeight: 60
                }
            }
        },

        // Organizational structure configuration
        org: {
            enabled: true,
            name: 'Организационная структура',
            description: 'Схема организационной структуры',

            shapes: {
                position: {
                    type: 'position',
                    shape: 'rectangle',
                    fillColor: '#dae8fc',
                    strokeColor: '#6c8ebf',
                    defaultWidth: 120,
                    defaultHeight: 60
                },
                department: {
                    type: 'department',
                    shape: 'rectangle',
                    fillColor: '#d5e8d4',
                    strokeColor: '#82b366',
                    defaultWidth: 140,
                    defaultHeight: 80
                },
                person: {
                    type: 'person',
                    shape: 'ellipse',
                    fillColor: '#f8cecc',
                    strokeColor: '#b85450',
                    defaultWidth: 100,
                    defaultHeight: 60
                }
            }
        },

        // BPMN configuration (basic support)
        bpmn: {
            enabled: true,
            name: 'BPMN',
            description: 'Business Process Model and Notation',

            shapes: {
                task: {
                    type: 'task',
                    shape: 'rectangle',
                    fillColor: '#dae8fc',
                    strokeColor: '#6c8ebf',
                    defaultWidth: 100,
                    defaultHeight: 60
                },
                gateway: {
                    type: 'gateway',
                    shape: 'rhombus',
                    fillColor: '#fff2cc',
                    strokeColor: '#d6b656',
                    defaultWidth: 50,
                    defaultHeight: 50
                },
                event: {
                    type: 'event',
                    shape: 'ellipse',
                    fillColor: '#f8cecc',
                    strokeColor: '#b85450',
                    defaultWidth: 40,
                    defaultHeight: 40
                }
            }
        }
    },

    // File handling
    files: {
        // Default file extension
        defaultExtension: '.drawio',

        // Supported file formats
        supportedFormats: ['drawio', 'xml'],

        // Auto-save settings
        autoSave: {
            enabled: true,
            intervalSeconds: 300 // 5 minutes
        },

        // Export formats
        exportFormats: ['png', 'jpg', 'svg', 'pdf', 'xml']
    },

    // Model validation rules
    validation: {
        enabled: true,

        rules: {
            // VAD validation rules
            vad: {
                requireRole: true,
                checkProcessNaming: true,
                validateConnections: true
            },

            // EPC validation rules
            epc: {
                alternateEventFunction: true,
                checkConnectorUsage: true
            }
        }
    },

    // Drawing tools configuration
    tools: {
        // Selection tool
        selection: {
            multiSelect: true,
            rubberBand: true
        },

        // Drawing modes
        drawingModes: {
            freehand: false,
            orthogonal: true,
            curved: true
        }
    },

    // Help system
    help: {
        // Help content location
        baseUrl: './help/',

        // Default help page
        defaultPage: 'index.html',

        // Show tips on startup
        showTipsOnStartup: true
    },

    // GitHub integration (for loading/saving diagrams)
    github: {
        enabled: false,
        username: '',
        repository: '',
        branch: 'main',
        folder: 'diagrams'
    },

    // Developer settings
    developer: {
        // Enable debug mode
        debug: false,

        // Show console logs
        verbose: false,

        // Enable performance monitoring
        performanceMonitoring: false
    }
};

// Freeze configuration to prevent accidental modifications at runtime
// Comment this line if you need to modify config dynamically
// Object.freeze(AppConfig);
