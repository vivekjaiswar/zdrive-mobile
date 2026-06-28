import 'package:flutter/material.dart';

import '../../services/auth_service.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() =>
      _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState
    extends State<ForgotPasswordScreen> {
  final emailController = TextEditingController();

  final AuthService _authService = AuthService();

  bool isLoading = false;
  String? message;
  String? error;

  Future<void> sendResetLink() async {
    try {
      setState(() {
        isLoading = true;
        message = null;
        error = null;
      });

      final response =
          await _authService.forgotPassword(
        email: emailController.text.trim(),
      );

      setState(() {
        message = response['message'];
      });
    } catch (e) {
      setState(() {
        error = e.toString();
      });
    } finally {
      setState(() {
        isLoading = false;
      });
    }
  }

  @override
  void dispose() {
    emailController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Forgot Password'),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              TextField(
                controller: emailController,
                keyboardType:
                    TextInputType.emailAddress,
                decoration: const InputDecoration(
                  labelText: 'Email',
                  border: OutlineInputBorder(),
                ),
              ),

              const SizedBox(height: 24),

              if (message != null)
                Text(
                  message!,
                  style: const TextStyle(
                    color: Colors.green,
                  ),
                ),

              if (error != null)
                Text(
                  error!,
                  style: const TextStyle(
                    color: Colors.red,
                  ),
                ),

              const SizedBox(height: 24),

              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed:
                      isLoading ? null : sendResetLink,
                  child: isLoading
                      ? const CircularProgressIndicator()
                      : const Text(
                          'Send Reset Link',
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}