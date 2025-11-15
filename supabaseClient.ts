import { createClient } from '@supabase/supabase-js';

// --- AVISO DE SEGURANÇA IMPORTANTE ---
// 1. NUNCA partilhe as suas chaves de API do Supabase publicamente (ex: em repositórios de código).
// 2. CERTIFIQUE-SE de que ativou o "Row Level Security" (RLS) em TODAS as suas tabelas na base de dados.
// 3. Sem o RLS ativo, qualquer pessoa com estas chaves pode ler, modificar ou apagar todos os seus dados.
//
// As chaves abaixo permitem que a aplicação se conecte ao seu projeto. Se o RLS estiver
// configurado corretamente, a segurança está garantida.

const supabaseUrl = 'https://ixwpnecamexsrjndoedj.supabase.co'; // O seu URL do Supabase
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4d3BuZWNhbWV4c3JqbmRvZWRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4Njk3MDYsImV4cCI6MjA3ODQ0NTcwNn0.u4ju_Bsk8Gg-TSqLNGWznG3yRXq88ygtcNu0ce0xBPk'; // A sua chave 'anon' do Supabase

export const supabase = createClient(supabaseUrl, supabaseAnonKey);