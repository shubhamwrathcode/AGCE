if(NOT TARGET fbjni::fbjni)
add_library(fbjni::fbjni SHARED IMPORTED)
set_target_properties(fbjni::fbjni PROPERTIES
    IMPORTED_LOCATION "/Users/wrathcodetechnology/.gradle/caches/8.13/transforms/32967fc9c20fbc4168bb1c7886f5c054/transformed/jetified-fbjni-0.7.0/prefab/modules/fbjni/libs/android.armeabi-v7a/libfbjni.so"
    INTERFACE_INCLUDE_DIRECTORIES "/Users/wrathcodetechnology/.gradle/caches/8.13/transforms/32967fc9c20fbc4168bb1c7886f5c054/transformed/jetified-fbjni-0.7.0/prefab/modules/fbjni/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

