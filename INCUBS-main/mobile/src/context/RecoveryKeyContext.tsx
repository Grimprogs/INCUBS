import React, { createContext, useContext, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';

type RecoveryKeyContextType = {
  showRecoveryKey: (key: string) => void;
  hideRecoveryKey: () => void;
};

const RecoveryKeyContext = createContext<RecoveryKeyContextType | undefined>(undefined);

export function RecoveryKeyProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [recoveryKey, setRecoveryKey] = useState('');

  const showRecoveryKey = (key: string) => {
    console.log('[RecoveryKeyContext] Showing recovery key modal');
    setRecoveryKey(key);
    setVisible(true);
  };

  const hideRecoveryKey = () => {
    console.log('[RecoveryKeyContext] Hiding recovery key modal');
    setVisible(false);
    setRecoveryKey('');
  };

  return (
    <RecoveryKeyContext.Provider value={{ showRecoveryKey, hideRecoveryKey }}>
      <View style={{ flex: 1 }}>
        {children}
        
        {/* Global Recovery Key Modal Overlay */}
        {visible && (
          <View style={styles.modalOverlay} pointerEvents="box-none">
            <View style={styles.modalBackdrop} />
            <View style={styles.modalCenterContainer}>
              <View style={styles.modalContent}>
                {/* Close Button */}
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={hideRecoveryKey}
                  activeOpacity={0.7}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>

                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>🔑 Save Your Recovery Key</Text>
                  <Text style={styles.modalSubtitle}>
                    This key will help you reset your password if you forget it. Save it in a secure place.
                  </Text>
                </View>

                <View style={styles.keyContainer}>
                  <Text style={styles.keyLabel}>Your Recovery Key:</Text>
                  <View style={styles.keyBox}>
                    <Text style={styles.keyText} selectable={true}>{recoveryKey}</Text>
                  </View>
                  <Text style={styles.keyWarning}>
                    ⚠️ You won't be able to see this key again. Make sure to save it now!
                  </Text>
                </View>

                <View style={styles.instructionsBox}>
                  <Text style={styles.instructionsTitle}>💡 How to save your key:</Text>
                  <Text style={styles.instructionsText}>• Take a screenshot</Text>
                  <Text style={styles.instructionsText}>• Write it down on paper</Text>
                  <Text style={styles.instructionsText}>• Copy it to a password manager</Text>
                </View>

                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={hideRecoveryKey}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalButtonText}>I've Saved My Key - Continue</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>
    </RecoveryKeyContext.Provider>
  );
}

export function useRecoveryKey() {
  const context = useContext(RecoveryKeyContext);
  if (!context) {
    throw new Error('useRecoveryKey must be used within RecoveryKeyProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalCenterContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#6B7280',
    fontWeight: '600',
  },
  modalHeader: {
    marginBottom: 24,
    alignItems: 'center',
    paddingRight: 32,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  keyContainer: {
    marginBottom: 20,
  },
  keyLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  keyBox: {
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#2563EB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  keyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2563EB',
    textAlign: 'center',
    letterSpacing: 1,
  },
  keyWarning: {
    fontSize: 12,
    color: '#DC2626',
    textAlign: 'center',
    lineHeight: 18,
  },
  instructionsBox: {
    backgroundColor: '#DBEAFE',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 22,
  },
  modalButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});