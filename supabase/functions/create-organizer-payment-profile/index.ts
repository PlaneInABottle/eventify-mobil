/* eslint-disable import/no-unresolved */
// deno-lint-ignore-file require-await no-inner-declarations no-explicit-any

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"
import { corsHeaders } from "../_shared/cors"
import Iyzipay from "npm:iyzipay"

interface IyzipayResponse {
  status: "success" | "failure"
  locale: string
  systemTime: number
  conversationId: string
  subMerchantKey?: string
  errorCode?: string
  errorMessage?: string
  errorGroup?: string
}

interface RequestBody {
  userId: string
  name: string
  email: string
  gsmNumber: string
  address: string
  iban: string
  subMerchantExternalId: string
  contactName: string
  contactSurname: string
  taxOffice: string
  legalCompanyTitle: string
  identityNumber: string
  subMerchantType: "PERSONAL" | "PRIVATE_COMPANY" | "LIMITED_OR_JOINT_STOCK_COMPANY"
  taxNumber?: string
}

interface SubMerchantData extends Omit<RequestBody, "userId"> {}

Deno.serve(async (req: Request) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      },
    )

    const iyzipay = new Iyzipay({
      apiKey: Deno.env.get("IYZICO_API_KEY"),
      secretKey: Deno.env.get("IYZICO_API_SECRET"),
      baseUrl: Deno.env.get("IYZICO_BASE_URL"),
    })

    const {
      userId,
      name,
      email,
      gsmNumber,
      address,
      iban,
      subMerchantExternalId,
      contactName,
      contactSurname,
      taxOffice,
      legalCompanyTitle,
      identityNumber,
      subMerchantType,
      taxNumber,
    } = (await req.json()) as RequestBody

    async function createSubMerchant(
      type: RequestBody["subMerchantType"],
      data: SubMerchantData,
    ): Promise<IyzipayResponse> {
      return new Promise((resolve, reject) => {
        const subMerchantRequest = {
          locale: Iyzipay.LOCALE.TR,
          conversationId: "123456789",
          subMerchantExternalId: data.subMerchantExternalId,
          address: data.address,
          email: data.email,
          gsmNumber: data.gsmNumber,
          name: data.name,
          iban: data.iban,
          currency: Iyzipay.CURRENCY.TRY,
        }

        switch (type) {
          case "PERSONAL":
            Object.assign(subMerchantRequest, {
              subMerchantType: Iyzipay.SUB_MERCHANT_TYPE.PERSONAL,
              contactName: data.contactName,
              contactSurname: data.contactSurname,
              identityNumber: data.identityNumber,
            })
            break
          case "PRIVATE_COMPANY":
            Object.assign(subMerchantRequest, {
              subMerchantType: Iyzipay.SUB_MERCHANT_TYPE.PRIVATE_COMPANY,
              taxOffice: data.taxOffice,
              legalCompanyTitle: data.legalCompanyTitle,
              identityNumber: data.identityNumber,
            })
            break
          case "LIMITED_OR_JOINT_STOCK_COMPANY":
            Object.assign(subMerchantRequest, {
              subMerchantType: Iyzipay.SUB_MERCHANT_TYPE.LIMITED_OR_JOINT_STOCK_COMPANY,
              taxOffice: data.taxOffice,
              taxNumber: data.taxNumber,
              legalCompanyTitle: data.legalCompanyTitle,
            })
            break
          default:
            return reject(new Error("Invalid subMerchantType"))
        }

        iyzipay.subMerchant.create(subMerchantRequest, (err: any, result: any) => {
          if (err) reject(err)
          else if (result.status === "failure")
            reject(new Error(`Iyzipay Error: ${result.errorMessage} (Code: ${result.errorCode})`))
          else resolve(result)
        })
      })
    }

    const subMerchantResponse = await createSubMerchant(subMerchantType, {
      subMerchantExternalId,
      address,
      email,
      gsmNumber,
      name,
      iban,
      contactName,
      contactSurname,
      identityNumber,
      taxOffice,
      legalCompanyTitle,
      taxNumber,
      subMerchantType,
    })

    const { error } = await supabaseClient.from("company_payment_profile").insert({
      name,
      email,
      gsm_number: gsmNumber,
      address,
      iban,
      sub_merchant_external_id: subMerchantExternalId,
      contact_name: contactName,
      contact_surname: contactSurname,
      tax_office: taxOffice,
      legal_company_title: legalCompanyTitle,
      identity_number: identityNumber,
      sub_merchant_type: subMerchantType,
      tax_number: taxNumber,
      sub_merchant_key: subMerchantResponse.subMerchantKey,
    })

    if (error) throw error

    return new Response(
      JSON.stringify({
        subMerchantResponse,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    )
  } catch (error: any) {
    // Structured error response
    return new Response(
      JSON.stringify({
        error: true,
        status: error.status || "failure",
        errorCode: error.errorCode || "UNKNOWN_ERROR",
        errorGroup: error.errorGroup,
        message: error.errorMessage || error.message,
        systemTime: error.systemTime || Date.now(),
        conversationId: error.conversationId,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      },
    )
  }
})
