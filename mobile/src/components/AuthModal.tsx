import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { Colors, HighContrastColors, Typography } from '../theme/tokens'
import { translations, type Language } from '../i18n/translations'
import { api } from '../services/api'
import type { User } from '../types'

interface AuthModalProps {
  visible: boolean
  onClose: () => void
  onSuccess: (user: User) => void
  highContrast: boolean
  fontSize: 'normal' | 'large' | 'xlarge'
  language?: Language
}

export const AuthModal: React.FC<AuthModalProps> = ({
  visible,
  onClose,
  onSuccess,
  highContrast,
  fontSize,
  language = 'en',
}) => {
  const t = translations[language]
  const theme = highContrast ? HighContrastColors : Colors
  const fs = Typography.fontSizes[fontSize]

  const [isLogin, setIsLogin] = useState<boolean>(true)
  const [step, setStep] = useState<number>(1)
  const [loading, setLoading] = useState<boolean>(false)

  // Form Fields
  const [email, setEmail] = useState<string>('meenakshi.amma@example.com')
  const [password, setPassword] = useState<string>('password123')
  const [fullName, setFullName] = useState<string>('Meenakshi Amma')
  const [userType, setUserType] = useState<'senior' | 'homemaker' | 'customer'>('senior')
  const [age, setAge] = useState<string>('68')
  const [phone, setPhone] = useState<string>('+91 98200 12345')
  const [locationName, setLocationName] = useState<string>('Matunga / Dadar, Mumbai')
  const [languages, setLanguages] = useState<string>('Tamil, Hindi, English')
  const [bio, setBio] = useState<string>('Traditional South Indian cooking, home tiffin, and pickle specialist')

  const handleSubmit = async () => {
    if (!isLogin && step === 1) {
      setStep(2)
      return
    }

    setLoading(true)
    try {
      if (isLogin) {
        const res = await api.login(email, password)
        onSuccess(res.user)
      } else {
        const role = userType === 'customer' ? 'customer' : 'provider'
        const res = await api.signup({
          email,
          password,
          full_name: fullName,
          role,
          user_type: userType,
          age: parseInt(age, 10) || 60,
          phone,
          location_name: locationName,
          languages,
          bio,
        })
        onSuccess(res.user)
      }
      onClose()
    } catch (err: any) {
      Alert.alert('Authentication Error', err.message || 'Please check your inputs.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.modalCard, { backgroundColor: theme.bgSurface }]}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.modalTitle, { fontSize: fs.lg, color: theme.textDark }]}>
                {isLogin ? 'Sign In to SilverHands' : step === 1 ? 'Create Account' : 'Profile & Location'}
              </Text>
              <Text style={[styles.modalSub, { fontSize: fs.xs, color: theme.textMuted }]}>
                {isLogin ? 'Access your dashboard & opportunities' : `Step ${step} of 2`}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {isLogin ? (
              <View style={styles.formGroup}>
                <Text style={[styles.inputLabel, { fontSize: fs.xs, color: theme.textSecondary }]}>Email Address</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="e.g. name@example.com"
                  placeholderTextColor="#94A3B8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={[styles.input, { borderColor: theme.borderSubtle, color: theme.textDark }]}
                />

                <Text style={[styles.inputLabel, { fontSize: fs.xs, color: theme.textSecondary }]}>Password</Text>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry
                  style={[styles.input, { borderColor: theme.borderSubtle, color: theme.textDark }]}
                />
              </View>
            ) : step === 1 ? (
              <View style={styles.formGroup}>
                <Text style={[styles.inputLabel, { fontSize: fs.xs, color: theme.textSecondary }]}>Registering as:</Text>
                <View style={styles.rolePicker}>
                  {[
                    { id: 'senior', label: 'Senior (60+)' },
                    { id: 'homemaker', label: 'Homemaker' },
                    { id: 'customer', label: 'Customer' },
                  ].map((r) => (
                    <TouchableOpacity
                      key={r.id}
                      onPress={() => setUserType(r.id as any)}
                      style={[
                        styles.roleButton,
                        userType === r.id && { backgroundColor: theme.indigoPrimary, borderColor: theme.indigoPrimary },
                      ]}
                    >
                      <Text
                        style={[
                          styles.roleButtonText,
                          { color: userType === r.id ? '#FFFFFF' : theme.textDark },
                        ]}
                      >
                        {r.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[styles.inputLabel, { fontSize: fs.xs, color: theme.textSecondary }]}>Full Name</Text>
                <TextInput
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="e.g. Ramesh Patel"
                  placeholderTextColor="#94A3B8"
                  style={[styles.input, { borderColor: theme.borderSubtle, color: theme.textDark }]}
                />

                <View style={styles.rowInputs}>
                  <View style={styles.halfInput}>
                    <Text style={[styles.inputLabel, { fontSize: fs.xs, color: theme.textSecondary }]}>Age</Text>
                    <TextInput
                      value={age}
                      onChangeText={setAge}
                      keyboardType="numeric"
                      style={[styles.input, { borderColor: theme.borderSubtle, color: theme.textDark }]}
                    />
                  </View>
                  <View style={styles.halfInput}>
                    <Text style={[styles.inputLabel, { fontSize: fs.xs, color: theme.textSecondary }]}>Phone (+91)</Text>
                    <TextInput
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                      style={[styles.input, { borderColor: theme.borderSubtle, color: theme.textDark }]}
                    />
                  </View>
                </View>

                <Text style={[styles.inputLabel, { fontSize: fs.xs, color: theme.textSecondary }]}>Email Address</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="name@example.com"
                  placeholderTextColor="#94A3B8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={[styles.input, { borderColor: theme.borderSubtle, color: theme.textDark }]}
                />

                <Text style={[styles.inputLabel, { fontSize: fs.xs, color: theme.textSecondary }]}>Password</Text>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Min 6 characters"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry
                  style={[styles.input, { borderColor: theme.borderSubtle, color: theme.textDark }]}
                />
              </View>
            ) : (
              <View style={styles.formGroup}>
                <Text style={[styles.inputLabel, { fontSize: fs.xs, color: theme.textSecondary }]}>Neighborhood / City</Text>
                <TextInput
                  value={locationName}
                  onChangeText={setLocationName}
                  placeholder="e.g. Dadar, Mumbai or Mylapore, Chennai"
                  placeholderTextColor="#94A3B8"
                  style={[styles.input, { borderColor: theme.borderSubtle, color: theme.textDark }]}
                />

                <Text style={[styles.inputLabel, { fontSize: fs.xs, color: theme.textSecondary }]}>Languages Spoken</Text>
                <TextInput
                  value={languages}
                  onChangeText={setLanguages}
                  placeholder="e.g. Tamil, Hindi, English"
                  placeholderTextColor="#94A3B8"
                  style={[styles.input, { borderColor: theme.borderSubtle, color: theme.textDark }]}
                />

                <Text style={[styles.inputLabel, { fontSize: fs.xs, color: theme.textSecondary }]}>Short Biography</Text>
                <TextInput
                  value={bio}
                  onChangeText={setBio}
                  placeholder="Describe your skills or what you are seeking..."
                  placeholderTextColor="#94A3B8"
                  multiline
                  numberOfLines={3}
                  style={[styles.input, styles.textArea, { borderColor: theme.borderSubtle, color: theme.textDark }]}
                />
              </View>
            )}

            {/* Actions */}
            <View style={styles.actionRow}>
              {!isLogin && step === 2 && (
                <TouchableOpacity onPress={() => setStep(1)} style={styles.backBtn}>
                  <Text style={styles.backBtnText}>← Back</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={handleSubmit}
                disabled={loading}
                style={[
                  styles.submitBtn,
                  { backgroundColor: theme.indigoPrimary, flex: 1 },
                ]}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitBtnText}>
                    {isLogin ? 'Sign In' : step === 1 ? 'Next Step →' : 'Complete Registration'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Toggle Mode */}
            <TouchableOpacity
              onPress={() => {
                setIsLogin(!isLogin)
                setStep(1)
              }}
              style={styles.toggleRow}
            >
              <Text style={[styles.toggleText, { color: theme.indigoPrimary }]}>
                {isLogin ? 'New to SilverHands? Create account' : 'Already have an account? Sign In'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontWeight: '900',
  },
  modalSub: {
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#64748B',
  },
  scrollArea: {
    marginTop: 12,
  },
  formGroup: {
    gap: 8,
  },
  inputLabel: {
    fontWeight: '700',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#F8FAFC',
    minHeight: 44,
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  rolePicker: {
    flexDirection: 'row',
    gap: 6,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  roleButtonText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 8,
  },
  halfInput: {
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  backBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  submitBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  toggleRow: {
    paddingVertical: 16,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '700',
  },
})
