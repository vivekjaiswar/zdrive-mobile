import 'package:flutter/material.dart';

import '../../services/auth_service.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() =>
      _RegisterScreenState();
}

class _RegisterScreenState
    extends State<RegisterScreen> {
  final emailController = TextEditingController();
  final passwordController = TextEditingController();

  final AuthService _authService = AuthService();

  bool isLoading = false;
  String? message;
  String? error;

  Future<void> register() async {
    try {
      setState(() {
        isLoading = true;
        error = null;
        message = null;
      });

      final response =
          await _authService.register(
        email: emailController.text.trim(),
        password: passwordController.text,
      );

      setState(() {
        message = response['message'];
      });
    } catch (e) {
  if (e is Exception) {
    setState(() {
      error = e.toString();
    });
  }
  } finally {
      setState(() {
        isLoading = false;
      });
    }
  }

  @override
  void dispose() {
    emailController.dispose();
    passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Register'),
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

              const SizedBox(height: 16),

              TextField(
                controller: passwordController,
                obscureText: true,
                decoration: const InputDecoration(
                  labelText: 'Password',
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
                      isLoading ? null : register,
                  child: isLoading
                      ? const CircularProgressIndicator()
                      : const Text(
                          'Create Account',
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