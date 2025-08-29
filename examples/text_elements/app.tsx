import {
  Button,
  ColorSelector,
  FormField,
  Rows,
  Select,
  Text,
  TextInput,
  Title,
} from "@canva/app-ui-kit";
import type { FontWeight, TextAttributes } from "@canva/design";
import { useCallback, useState, useRef, useEffect } from "react";
import * as styles from "styles/components.css";
import { useAddElement } from "utils/use_add_element";
import WebFont from "webfontloader";

// Référence au canvas VectorCanvas depuis l'application principale
declare global {
  interface Window {
    canvasRef?: { 
      addText: (text: string, fontFamily: string, fontSize: number) => void 
    };
  }
}

type UIState = {
  text: string;
  color: string;
  fontWeight: FontWeight;
  fontStyle: TextAttributes["fontStyle"];
  decoration: TextAttributes["decoration"];
  textAlign: TextAttributes["textAlign"];
  fontSize: number;
  fontFamily: string;
};

const initialState: UIState = {
  text: "Hello world",
  color: "#ff0099",
  fontWeight: "normal",
  fontStyle: "normal",
  decoration: "none",
  textAlign: "start",
  fontSize: 32,
  fontFamily: "Arial",
};

export const App = () => {
  const [state, setState] = useState<UIState>(initialState);
  const addElement = useAddElement();
  const [useCanvaAPI, setUseCanvaAPI] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const { text, color, fontWeight, fontStyle, decoration, textAlign, fontSize, fontFamily } = state;
  const disabled = text.trim().length < 1 || color.trim().length < 1;

  // Méthode pour ajouter du texte au canvas Canva
  const addTextToCanva = useCallback(async () => {
    await addElement({
      type: "text",
      ...state,
      children: [state.text],
    });
  }, [state, addElement]);
  
  // Méthode pour ajouter du texte au canvas personnalisé
  const addTextToCanvas = useCallback(() => {
    if (window.canvasRef && window.canvasRef.addText) {
      WebFont.load({
        google: { families: [fontFamily] },
        active: () => {
          window.canvasRef?.addText(text, fontFamily, fontSize);
          setMessage("Texte ajouté au canvas!");
          setTimeout(() => setMessage(null), 2000);
        },
        inactive: () => setMessage(`Impossible de charger la police "${fontFamily}".`),
      });
    } else {
      setMessage("Canvas non disponible. Assurez-vous d'être dans l'application principale.");
      setTimeout(() => setMessage(null), 3000);
    }
  }, [text, fontFamily, fontSize]);
  
  // Fonction d'ajout de texte qui utilise soit l'API Canva, soit le canvas personnalisé
  const addText = useCallback(() => {
    if (useCanvaAPI) {
      addTextToCanva();
    } else {
      addTextToCanvas();
    }
  }, [useCanvaAPI, addTextToCanva, addTextToCanvas]);

  return (
    <div className={styles.scrollContainer}>
      <Rows spacing="2u">
        <Text>
          This example demonstrates how apps can add text elements to design.
        </Text>
        
        {/* Message de notification */}
        {message && (
          <div style={{ 
            padding: "8px 12px", 
            background: "#e8f5e9", 
            borderRadius: "4px", 
            marginBottom: "12px",
            border: "1px solid #c8e6c9",
            color: "#2e7d32"
          }}>
            {message}
          </div>
        )}
        
        {/* Bouton pour choisir entre API Canva et Canvas personnalisé */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
          <button
            onClick={() => setUseCanvaAPI(false)}
            style={{
              flex: 1,
              padding: "8px 12px",
              background: !useCanvaAPI ? "#2196f3" : "#e0e0e0",
              color: !useCanvaAPI ? "white" : "#333",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Utiliser le Canvas Personnalisé
          </button>
          <button
            onClick={() => setUseCanvaAPI(true)}
            style={{
              flex: 1,
              padding: "8px 12px",
              background: useCanvaAPI ? "#2196f3" : "#e0e0e0",
              color: useCanvaAPI ? "white" : "#333",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Utiliser l'API Canva
          </button>
        </div>
        
        <FormField
          label="Text"
          value={text}
          control={(props) => (
            <TextInput
              {...props}
              onChange={(value) => {
                setState((prevState) => {
                  return {
                    ...prevState,
                    text: value,
                  };
                });
              }}
            />
          )}
        />
        <Title size="small">Custom options</Title>
        <FormField
          label="Color"
          control={() => (
            <ColorSelector
              color={color}
              onChange={(value) => {
                setState((prevState) => {
                  return {
                    ...prevState,
                    color: value,
                  };
                });
              }}
            />
          )}
        />
        <FormField
          label="Font style"
          value={fontStyle}
          control={(props) => (
            <Select<TextAttributes["fontStyle"]>
              {...props}
              stretch
              onChange={(style) => {
                setState((prevState) => {
                  return {
                    ...prevState,
                    fontStyle: style,
                  };
                });
              }}
              options={[
                { value: "normal", label: "Normal" },
                { value: "italic", label: "Italic" },
              ]}
            />
          )}
        />
        <FormField
          label="Font weight"
          value={fontWeight}
          control={(props) => (
            <Select<FontWeight>
              {...props}
              stretch
              onChange={(fontWeight) => {
                setState((prevState) => {
                  return {
                    ...prevState,
                    fontWeight,
                  };
                });
              }}
              options={[
                { value: "normal", label: "Normal" },
                { value: "thin", label: "Thin" },
                { value: "extralight", label: "Extra light" },
                { value: "light", label: "Light" },
                { value: "medium", label: "Medium" },
                { value: "semibold", label: "Semibold" },
                { value: "bold", label: "Bold" },
                { value: "heavy", label: "Heavy" },
              ]}
            />
          )}
        />
        <FormField
          label="Decoration"
          value={decoration}
          control={(props) => (
            <Select<TextAttributes["decoration"]>
              {...props}
              stretch
              onChange={(decoration) => {
                setState((prevState) => {
                  return {
                    ...prevState,
                    decoration,
                  };
                });
              }}
              options={[
                { value: "none", label: "None" },
                { value: "underline", label: "Underline" },
              ]}
            />
          )}
        />
        <FormField
          label="Text align"
          value={textAlign}
          control={(props) => (
            <Select<TextAttributes["textAlign"]>
              {...props}
              stretch
              onChange={(textAlign) => {
                setState((prevState) => {
                  return {
                    ...prevState,
                    textAlign,
                  };
                });
              }}
              options={[
                { value: "start", label: "Start" },
                { value: "center", label: "Center" },
                { value: "end", label: "End" },
              ]}
            />
          )}
        />
        
        {/* Champs pour contrôler la police et la taille du texte (pour le canvas personnalisé) */}
        <FormField
          label="Font Family"
          value={fontFamily}
          control={(props) => (
            <Select
              {...props}
              stretch
              onChange={(fontFamily) => {
                setState((prevState) => ({
                  ...prevState,
                  fontFamily,
                }));
              }}
              options={[
                { value: "Arial", label: "Arial" },
                { value: "Roboto", label: "Roboto" },
                { value: "Open Sans", label: "Open Sans" },
                { value: "Montserrat", label: "Montserrat" },
                { value: "Playfair Display", label: "Playfair Display" },
                { value: "Pacifico", label: "Pacifico" },
                { value: "Lobster", label: "Lobster" },
              ]}
            />
          )}
        />
        
        <FormField
          label="Font Size"
          value={fontSize.toString()}
          control={(props) => (
            <TextInput
              {...props}
              type="number"
              onChange={(value) => {
                const size = parseInt(value, 10);
                if (!isNaN(size) && size > 0) {
                  setState((prevState) => ({
                    ...prevState,
                    fontSize: size,
                  }));
                }
              }}
            />
          )}
        />
        
        <Button variant="primary" onClick={addText} disabled={disabled} stretch>
          {useCanvaAPI ? "Add to Canva Design" : "Add to Custom Canvas"}
        </Button>
      </Rows>
    </div>
  );
};
