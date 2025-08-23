const logger = require('../config/logger');
const fs = require('fs').promises;
const path = require('path');

/**
 * Response Template Service
 * Manages response templates based on keyword tags
 */
class ResponseTemplateService {
  constructor() {
    this.templates = new Map();
    this.templatesPath = path.join(__dirname, '../data/response-templates.json');
    this.isInitialized = false;
  }

  /**
   * Initialize the service and load templates
   */
  async initialize() {
    try {
      await this.loadTemplates();
      this.isInitialized = true;
      logger.info('ResponseTemplateService initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize ResponseTemplateService:', error);
      throw error;
    }
  }

  /**
   * Load templates from JSON file
   */
  async loadTemplates() {
    try {
      // Check if templates file exists
      try {
        await fs.access(this.templatesPath);
      } catch (error) {
        // Create default templates if file doesn't exist
        await this.createDefaultTemplates();
      }

      const data = await fs.readFile(this.templatesPath, 'utf8');
      const templatesData = JSON.parse(data);

      // Clear existing templates
      this.templates.clear();

      // Load templates into memory
      for (const [tag, template] of Object.entries(templatesData.templates)) {
        this.templates.set(tag, {
          ...template,
          lastUsed: template.lastUsed ? new Date(template.lastUsed) : null,
          createdAt: new Date(template.createdAt),
          updatedAt: new Date(template.updatedAt)
        });
      }

      logger.info(`Loaded ${this.templates.size} response templates`);
    } catch (error) {
      logger.error('Failed to load templates:', error);
      throw error;
    }
  }

  /**
   * Create default response templates
   */
  async createDefaultTemplates() {
    const defaultTemplates = {
      version: "1.0.0",
      lastUpdated: new Date().toISOString(),
      templates: {
        "harga": {
          tag: "harga",
          name: "Harga Produk",
          description: "Template untuk pertanyaan tentang harga",
          dmMessage: "Halo! Terima kasih sudah bertanya tentang harga produk kami. Untuk informasi harga terbaru dan penawaran khusus, silakan cek link berikut: {productLink}",
          fallbackComment: "Halo! Untuk info harga lengkap, silakan DM kami ya 😊",
          variables: ["productLink"],
          isActive: true,
          priority: 1,
          usageCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        "stok": {
          tag: "stok",
          name: "Ketersediaan Stok",
          description: "Template untuk pertanyaan tentang stok",
          dmMessage: "Halo! Stok produk kami selalu update. Untuk cek ketersediaan real-time, silakan kunjungi: {productLink} atau DM kami untuk bantuan lebih lanjut.",
          fallbackComment: "Stok tersedia! DM kami untuk info lebih detail ya 📦",
          variables: ["productLink"],
          isActive: true,
          priority: 2,
          usageCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        "cara_order": {
          tag: "cara_order",
          name: "Cara Pemesanan",
          description: "Template untuk pertanyaan cara order",
          dmMessage: "Halo! Cara order sangat mudah:\n1. Klik link produk: {productLink}\n2. Pilih varian yang diinginkan\n3. Checkout dan bayar\n4. Produk akan dikirim ke alamat Anda\n\nAda pertanyaan lain? Silakan tanya kami!",
          fallbackComment: "Cara order mudah banget! DM kami untuk panduan lengkap ya 🛒",
          variables: ["productLink"],
          isActive: true,
          priority: 3,
          usageCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        "pengiriman": {
          tag: "pengiriman",
          name: "Informasi Pengiriman",
          description: "Template untuk pertanyaan tentang pengiriman",
          dmMessage: "Halo! Kami melayani pengiriman ke seluruh Indonesia melalui JNE, J&T, dan SiCepat. Estimasi pengiriman 2-4 hari kerja. Gratis ongkir untuk pembelian minimal Rp 100.000. Info lengkap: {productLink}",
          fallbackComment: "Pengiriman ke seluruh Indonesia! DM untuk info ongkir ya 🚚",
          variables: ["productLink"],
          isActive: true,
          priority: 4,
          usageCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        "pembayaran": {
          tag: "pembayaran",
          name: "Metode Pembayaran",
          description: "Template untuk pertanyaan tentang pembayaran",
          dmMessage: "Halo! Kami menerima pembayaran melalui:\n• Transfer Bank (BCA, Mandiri, BRI)\n• E-wallet (OVO, GoPay, DANA)\n• COD (area tertentu)\n• Kartu Kredit\n\nSemua aman dan terpercaya! Info lengkap: {productLink}",
          fallbackComment: "Banyak pilihan pembayaran! DM untuk info lengkap ya 💳",
          variables: ["productLink"],
          isActive: true,
          priority: 5,
          usageCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        "ukuran": {
          tag: "ukuran",
          name: "Size Chart",
          description: "Template untuk pertanyaan tentang ukuran",
          dmMessage: "Halo! Untuk size chart lengkap dan panduan memilih ukuran yang tepat, silakan cek: {productLink}\n\nJika masih bingung, kirim foto atau ukuran badan Anda, kami akan bantu rekomendasikan size yang pas!",
          fallbackComment: "Size chart lengkap ada di link bio! DM kami juga bisa ya 📏",
          variables: ["productLink"],
          isActive: true,
          priority: 6,
          usageCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        "bahan": {
          tag: "bahan",
          name: "Material Produk",
          description: "Template untuk pertanyaan tentang bahan",
          dmMessage: "Halo! Produk kami menggunakan bahan berkualitas tinggi yang nyaman dan tahan lama. Detail material dan care instruction bisa dilihat di: {productLink}\n\nAda pertanyaan spesifik tentang bahan? Silakan tanya kami!",
          fallbackComment: "Bahan berkualitas tinggi! DM untuk detail material ya 🧵",
          variables: ["productLink"],
          isActive: true,
          priority: 7,
          usageCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        "warna": {
          tag: "warna",
          name: "Pilihan Warna",
          description: "Template untuk pertanyaan tentang warna",
          dmMessage: "Halo! Kami punya banyak pilihan warna menarik. Lihat semua varian warna di: {productLink}\n\nWarna yang ditampilkan sudah sesuai dengan aslinya. Jika ada pertanyaan tentang warna tertentu, silakan DM kami!",
          fallbackComment: "Banyak pilihan warna cantik! Cek link bio atau DM kami ya 🌈",
          variables: ["productLink"],
          isActive: true,
          priority: 8,
          usageCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        "default": {
          tag: "default",
          name: "Default Response",
          description: "Template default untuk pertanyaan umum",
          dmMessage: "Halo! Terima kasih sudah menghubungi kami. Untuk informasi lengkap tentang produk, harga, dan cara order, silakan kunjungi: {productLink}\n\nAda pertanyaan lain? Kami siap membantu!",
          fallbackComment: "Halo! Terima kasih sudah bertanya. DM kami untuk info lengkap ya 😊",
          variables: ["productLink"],
          isActive: true,
          priority: 999,
          usageCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      }
    };

    // Ensure data directory exists
    const dataDir = path.dirname(this.templatesPath);
    try {
      await fs.access(dataDir);
    } catch (error) {
      await fs.mkdir(dataDir, { recursive: true });
    }

    await fs.writeFile(this.templatesPath, JSON.stringify(defaultTemplates, null, 2));
    logger.info('Created default response templates');
  }

  /**
   * Get response template by tag
   */
  getTemplate(tag) {
    if (!this.isInitialized) {
      throw new Error('ResponseTemplateService not initialized');
    }

    const template = this.templates.get(tag);
    if (!template) {
      // Return default template if specific tag not found
      const defaultTemplate = this.templates.get('default');
      if (defaultTemplate) {
        logger.warn(`Template for tag "${tag}" not found, using default template`);
        return defaultTemplate;
      }
      throw new Error(`Template for tag "${tag}" not found and no default template available`);
    }

    return template;
  }

  /**
   * Get response data for a tag with variable substitution
   */
  getResponseData(tag, variables = {}) {
    const template = this.getTemplate(tag);
    
    // Substitute variables in messages
    let dmMessage = template.dmMessage;
    let fallbackComment = template.fallbackComment;

    // Replace variables
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{${key}}`;
      dmMessage = dmMessage.replace(new RegExp(placeholder, 'g'), value || '');
      fallbackComment = fallbackComment.replace(new RegExp(placeholder, 'g'), value || '');
    }

    return {
      tag: template.tag,
      name: template.name,
      dmMessage,
      fallbackComment,
      priority: template.priority,
      productLink: variables.productLink || null
    };
  }

  /**
   * Update template usage statistics
   */
  async updateUsageStats(tag) {
    try {
      const template = this.templates.get(tag);
      if (template) {
        template.usageCount = (template.usageCount || 0) + 1;
        template.lastUsed = new Date();
        
        // Save to file
        await this.saveTemplates();
        
        logger.debug(`Updated usage stats for template "${tag}": ${template.usageCount} uses`);
      }
    } catch (error) {
      logger.error(`Failed to update usage stats for template "${tag}":`, error);
    }
  }

  /**
   * Save templates to file
   */
  async saveTemplates() {
    try {
      const templatesData = {
        version: "1.0.0",
        lastUpdated: new Date().toISOString(),
        templates: {}
      };

      // Convert Map to object
      for (const [tag, template] of this.templates.entries()) {
        templatesData.templates[tag] = {
          ...template,
          lastUsed: template.lastUsed ? template.lastUsed.toISOString() : null,
          createdAt: template.createdAt.toISOString(),
          updatedAt: template.updatedAt.toISOString()
        };
      }

      await fs.writeFile(this.templatesPath, JSON.stringify(templatesData, null, 2));
    } catch (error) {
      logger.error('Failed to save templates:', error);
      throw error;
    }
  }

  /**
   * Get all templates
   */
  getAllTemplates() {
    if (!this.isInitialized) {
      throw new Error('ResponseTemplateService not initialized');
    }

    const templates = [];
    for (const [tag, template] of this.templates.entries()) {
      templates.push({
        tag,
        name: template.name,
        description: template.description,
        isActive: template.isActive,
        priority: template.priority,
        usageCount: template.usageCount || 0,
        lastUsed: template.lastUsed,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt
      });
    }

    return templates.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Add or update template
   */
  async setTemplate(tag, templateData) {
    const template = {
      tag,
      name: templateData.name,
      description: templateData.description,
      dmMessage: templateData.dmMessage,
      fallbackComment: templateData.fallbackComment,
      variables: templateData.variables || [],
      isActive: templateData.isActive !== false,
      priority: templateData.priority || 999,
      usageCount: templateData.usageCount || 0,
      createdAt: templateData.createdAt ? new Date(templateData.createdAt) : new Date(),
      updatedAt: new Date()
    };

    this.templates.set(tag, template);
    await this.saveTemplates();
    
    logger.info(`Template "${tag}" saved successfully`);
    return template;
  }

  /**
   * Delete template
   */
  async deleteTemplate(tag) {
    if (tag === 'default') {
      throw new Error('Cannot delete default template');
    }

    const deleted = this.templates.delete(tag);
    if (deleted) {
      await this.saveTemplates();
      logger.info(`Template "${tag}" deleted successfully`);
    }
    
    return deleted;
  }

  /**
   * Get template statistics
   */
  getStatistics() {
    const stats = {
      totalTemplates: this.templates.size,
      activeTemplates: 0,
      totalUsage: 0,
      mostUsedTemplate: null,
      leastUsedTemplate: null,
      recentlyUsed: []
    };

    let maxUsage = 0;
    let minUsage = Infinity;

    for (const [tag, template] of this.templates.entries()) {
      if (template.isActive) {
        stats.activeTemplates++;
      }

      const usage = template.usageCount || 0;
      stats.totalUsage += usage;

      if (usage > maxUsage) {
        maxUsage = usage;
        stats.mostUsedTemplate = { tag, usage, name: template.name };
      }

      if (usage < minUsage) {
        minUsage = usage;
        stats.leastUsedTemplate = { tag, usage, name: template.name };
      }

      if (template.lastUsed) {
        stats.recentlyUsed.push({
          tag,
          name: template.name,
          lastUsed: template.lastUsed,
          usage
        });
      }
    }

    // Sort recently used by last used date
    stats.recentlyUsed.sort((a, b) => b.lastUsed - a.lastUsed);
    stats.recentlyUsed = stats.recentlyUsed.slice(0, 5); // Top 5

    return stats;
  }
}

// Create singleton instance
const responseTemplateService = new ResponseTemplateService();

module.exports = responseTemplateService;
