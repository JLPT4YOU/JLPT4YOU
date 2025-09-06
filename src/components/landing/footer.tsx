"use client"

import { motion } from "framer-motion"
import { GraduationCap, Mail, MessageCircle, FileText, Shield, Heart } from "lucide-react"
import { TranslationData } from "@/lib/i18n/"
import { useTranslation } from "@/lib/use-translation"

interface FooterProps {
  translations: TranslationData
}

// Footer Component
export const Footer = ({ translations }: FooterProps) => {
  const { t } = useTranslation(translations)
  const footerLinksData = t('footer.links') as {
    product: { title: string; features: string; pricing: string; aiDemo: string; resources: string }
    jlptLevels: { title: string; n5: string; n4: string; n3: string; n2: string; n1: string }
    support: { title: string; helpCenter: string; contact: string; faq: string; guide: string }
    legal: { title: string; terms: string; privacy: string; refund: string }
  }

  const footerLinks = {
    product: [
      { name: footerLinksData.product.features, href: "#features" },
      { name: footerLinksData.product.pricing, href: "#pricing" },
      { name: footerLinksData.product.aiDemo, href: "#ai-demo-section" },
      { name: footerLinksData.product.resources, href: "#resources" },
    ],
    support: [
      { name: footerLinksData.support.helpCenter, href: "#help" },
      { name: footerLinksData.support.contact, href: "#contact" },
      { name: footerLinksData.support.faq, href: "#faq" },
      { name: footerLinksData.support.guide, href: "#guide" },
    ],
    legal: [
      { name: footerLinksData.legal.terms, href: "#terms" },
      { name: footerLinksData.legal.privacy, href: "#privacy" },
      { name: footerLinksData.legal.refund, href: "#refund" },
    ],
    levels: [
      { name: footerLinksData.jlptLevels.n5, href: "#n5" },
      { name: footerLinksData.jlptLevels.n4, href: "#n4" },
      { name: footerLinksData.jlptLevels.n3, href: "#n3" },
      { name: footerLinksData.jlptLevels.n2, href: "#n2" },
      { name: footerLinksData.jlptLevels.n1, href: "#n1" },
    ]
  }

  return (
    <footer className="relative bg-background border-t border-border/50">
      <div className="app-container px-4">
        {/* Main Footer Content */}
        <div className="py-8 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 lg:gap-12">
            {/* Brand Section */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                {/* Logo */}
                <div className="flex items-center gap-2 mb-3 md:mb-4">
                  <div className="w-7 md:w-8 h-7 md:h-8 bg-foreground rounded-lg flex items-center justify-center">
                    <GraduationCap className="w-4 md:w-5 h-4 md:h-5 text-background" />
                  </div>
                  <span className="text-lg md:text-xl font-bold text-foreground">JLPT4YOU</span>
                </div>

                {/* Description */}
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-4 md:mb-6 max-w-md">
                  {t('footer.description')}
                </p>

                {/* Contact Info */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    <span>{t('footer.contact.email')}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <MessageCircle className="w-4 h-4" />
                    <span>{t('footer.contact.chat')}</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Product Links */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">
                  {footerLinksData.product.title}
                </h3>
                <ul className="space-y-3">
                  {footerLinks.product.map((link) => (
                    <li key={link.name}>
                      <a
                        href={link.href}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {link.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>

            {/* JLPT Levels */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">
                  {footerLinksData.jlptLevels.title}
                </h3>
                <ul className="space-y-3">
                  {footerLinks.levels.map((link) => (
                    <li key={link.name}>
                      <a
                        href={link.href}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {link.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>

            {/* Support & Legal */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">
                  {footerLinksData.support.title}
                </h3>
                <ul className="space-y-3 mb-6">
                  {footerLinks.support.map((link) => (
                    <li key={link.name}>
                      <a
                        href={link.href}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {link.name}
                      </a>
                    </li>
                  ))}
                </ul>

                <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">
                  {footerLinksData.legal.title}
                </h3>
                <ul className="space-y-3">
                  {footerLinks.legal.map((link) => (
                    <li key={link.name}>
                      <a
                        href={link.href}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {link.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-border/50 py-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-col md:flex-row items-center justify-between gap-4"
          >
            {/* Copyright */}
            <div className="text-sm text-muted-foreground">
              {t('footer.copyright')}
            </div>

            {/* Made with love */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{t('footer.madeWithLove')}</span>
              <Heart className="w-4 h-4 text-foreground fill-current" />
              <span>{t('footer.madeWithLoveFor')}</span>
            </div>

            {/* Trust Badges */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Shield className="w-4 h-4" />
                <span>{t('footer.trustBadges.secure')}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <FileText className="w-4 h-4" />
                <span>{t('footer.trustBadges.privacy')}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </footer>
  )
}
