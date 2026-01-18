// Script to add home page translations to all language files
const fs = require('fs');
const path = require('path');

const translations = {
  fr: {
    features: {
      title: "Caractéristiques Clés de VisuTry",
      subtitle: "Découvrez la prochaine génération d'essayage virtuel par IA",
      feature1: {
        title: "Google Nano Banana",
        description: "Propulsé par le dernier modèle d'IA de Google pour des résultats d'essayage ultra-réalistes avec une précision exceptionnelle et un éclairage naturel."
      },
      feature2: {
        title: "Rétention Intelligente des Données",
        description: "Votre historique d'essayage est stocké en toute sécurité - 7 jours pour les utilisateurs gratuits, 90 jours avec Crédits et 1 an pour les membres Premium."
      },
      feature3: {
        title: "Traitement Ultra-Rapide",
        description: "Obtenez vos résultats d'essayage en 10-30 secondes avec notre pipeline IA optimisé. Les utilisateurs Premium bénéficient d'un traitement prioritaire."
      },
      feature4: {
        title: "Confidentialité Protégée",
        description: "Vos photos sont cryptées et sécurisées. Nous ne partageons jamais vos images ni ne les utilisons pour l'entraînement sans permission."
      }
    },
    faq: {
      title: "Questions Fréquemment Posées",
      subtitle: "Tout ce que vous devez savoir sur VisuTry",
      q1: {
        question: "Comment fonctionne l'essayage IA de VisuTry ?",
        answer: "VisuTry utilise Google Nano Banana IA pour analyser vos traits faciaux et superposer des lunettes de manière réaliste sur votre photo. L'IA comprend la forme du visage, l'éclairage et la perspective pour créer des résultats d'apparence naturelle en quelques secondes."
      },
      q2: {
        question: "Mes données photo sont-elles sûres et privées ?",
        answer: "Absolument ! Vos photos sont cryptées pendant le téléchargement et le traitement. Nous ne partageons jamais vos images publiquement ni ne les utilisons pour l'entraînement de l'IA sans permission explicite. Les données des utilisateurs gratuits sont stockées pendant 7 jours, les utilisateurs de Crédits pendant 90 jours et les membres Premium pendant 1 an."
      },
      q3: {
        question: "Quelle est la différence entre la qualité gratuite et Premium ?",
        answer: "Les utilisateurs gratuits obtiennent des images de qualité standard (800×800 pixels) avec un petit filigrane. Les utilisateurs Premium reçoivent des images de haute qualité (1200×1200 pixels) sans filigrane, plus un traitement prioritaire et une rétention de données plus longue (1 an vs 7 jours)."
      },
      q4: {
        question: "Puis-je utiliser les images générées commercialement ?",
        answer: "Oui ! Les utilisateurs Premium et Pack de Crédits peuvent utiliser leurs images sans filigrane à toutes fins, y compris commerciales. Les utilisateurs gratuits reçoivent des images avec filigrane pour usage personnel uniquement."
      },
      q5: {
        question: "Combien de temps faut-il pour générer un essayage ?",
        answer: "La plupart des essayages se terminent en 10-30 secondes. Les utilisateurs Premium bénéficient d'un traitement prioritaire, ce qui signifie des résultats plus rapides même pendant les heures de pointe. Le temps exact dépend de la charge du serveur et de la complexité de l'image."
      },
      q6: {
        question: "Qu'arrive-t-il à mon historique d'essayage ?",
        answer: "Votre historique d'essayage est automatiquement sauvegardé selon votre plan : Utilisateurs gratuits (7 jours), utilisateurs de Crédits (90 jours), utilisateurs Premium (1 an). Vous recevrez un rappel par e-mail 3 jours avant l'expiration, vous donnant le temps de télécharger ou de mettre à niveau."
      }
    }
  },
  de: {
    features: {
      title: "Hauptmerkmale von VisuTry",
      subtitle: "Erleben Sie die nächste Generation der KI-gestützten virtuellen Anprobe",
      feature1: {
        title: "Google Nano Banana",
        description: "Angetrieben von Googles neuestem KI-Modell für ultra-realistische Anprobeergebnisse mit außergewöhnlicher Genauigkeit und natürlicher Beleuchtung."
      },
      feature2: {
        title: "Intelligente Datenspeicherung",
        description: "Ihr Anprobehistorie wird sicher gespeichert - 7 Tage für kostenlose Benutzer, 90 Tage mit Credits und 1 Jahr für Premium-Mitglieder."
      },
      feature3: {
        title: "Blitzschnelle Verarbeitung",
        description: "Erhalten Sie Ihre Anprobeergebnisse in 10-30 Sekunden mit unserer optimierten KI-Pipeline. Premium-Benutzer genießen vorrangige Verarbeitung."
      },
      feature4: {
        title: "Datenschutz Geschützt",
        description: "Ihre Fotos sind verschlüsselt und sicher. Wir teilen Ihre Bilder niemals oder verwenden sie ohne Erlaubnis für das Training."
      }
    },
    faq: {
      title: "Häufig Gestellte Fragen",
      subtitle: "Alles, was Sie über VisuTry wissen müssen",
      q1: {
        question: "Wie funktioniert die KI-Anprobe von VisuTry?",
        answer: "VisuTry verwendet Google Nano Banana KI, um Ihre Gesichtszüge zu analysieren und Brillen realistisch auf Ihr Foto zu legen. Die KI versteht Gesichtsform, Beleuchtung und Perspektive, um in Sekunden natürlich aussehende Ergebnisse zu erstellen."
      },
      q2: {
        question: "Sind meine Fotodaten sicher und privat?",
        answer: "Absolut! Ihre Fotos werden während des Uploads und der Verarbeitung verschlüsselt. Wir teilen Ihre Bilder niemals öffentlich oder verwenden sie ohne ausdrückliche Erlaubnis für KI-Training. Daten kostenloser Benutzer werden 7 Tage gespeichert, Credits-Benutzer 90 Tage und Premium-Mitglieder 1 Jahr."
      },
      q3: {
        question: "Was ist der Unterschied zwischen kostenloser und Premium-Qualität?",
        answer: "Kostenlose Benutzer erhalten Bilder in Standardqualität (800×800 Pixel) mit einem kleinen Wasserzeichen. Premium-Benutzer erhalten hochwertige Bilder (1200×1200 Pixel) ohne Wasserzeichen, plus vorrangige Verarbeitung und längere Datenspeicherung (1 Jahr vs. 7 Tage)."
      },
      q4: {
        question: "Kann ich die generierten Bilder kommerziell nutzen?",
        answer: "Ja! Premium- und Credits-Pack-Benutzer können ihre wasserzeichenfreien Bilder für jeden Zweck verwenden, einschließlich kommerzieller Nutzung. Kostenlose Benutzer erhalten Bilder mit Wasserzeichen nur für den persönlichen Gebrauch."
      },
      q5: {
        question: "Wie lange dauert es, eine Anprobe zu generieren?",
        answer: "Die meisten Anproben werden in 10-30 Sekunden abgeschlossen. Premium-Benutzer genießen vorrangige Verarbeitung, was auch zu Spitzenzeiten schnellere Ergebnisse bedeutet. Die genaue Zeit hängt von der Serverlast und der Bildkomplexität ab."
      },
      q6: {
        question: "Was passiert mit meiner Anprobehistorie?",
        answer: "Ihre Anprobehistorie wird automatisch basierend auf Ihrem Plan gespeichert: Kostenlose Benutzer (7 Tage), Credits-Benutzer (90 Tage), Premium-Benutzer (1 Jahr). Sie erhalten 3 Tage vor Ablauf eine E-Mail-Erinnerung, die Ihnen Zeit zum Herunterladen oder Upgraden gibt."
      }
    }
  }
};

// Add translations to each language file
Object.keys(translations).forEach(lang => {
  const filePath = path.join(__dirname, '..', 'messages', `${lang}.json`);
  const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  // Add features and faq to home section
  if (!content.home.features) {
    content.home.features = translations[lang].features;
  }
  if (!content.home.faq) {
    content.home.faq = translations[lang].faq;
  }
  
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n');
  console.log(`✅ Updated ${lang}.json`);
});

console.log('✅ All translations added!');

